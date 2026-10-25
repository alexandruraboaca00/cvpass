"""Read-only, numeric environment/WAL observer; never opens SQLite connections.

Run around the unchanged official runner, not around a shortened substitute.
WAL-index offsets come from bundled sqlite3.c WalIndexHdr/WalCkptInfo (x86_64).
Only the two 48-byte headers and nBackfill are read, never the reserved locks.
"""
import argparse
import json
import os
from pathlib import Path
import signal
import struct
import subprocess
import sys
import time


def system_sample(previous, elapsed):
    cpu = [int(v) for v in Path('/proc/stat').read_text().splitlines()[0].split()[1:]]
    total, idle = sum(cpu[:8]), cpu[3] + cpu[4]
    now = time.monotonic()
    # A complete process census cost ~26 ms/second in the first diagnostic.
    # Keep CPU/IO/system sampling at 1 Hz, but census processes at 0.1 Hz and
    # obtain comm from stat itself. Never hide this different diagnostic cost.
    scan = previous is None or now - previous['procAt'] >= 10
    proc, proc_at, top = ({}, now, []) if scan else (previous['proc'], previous['procAt'], previous['top'])
    if scan:
        for item in Path('/proc').iterdir():
            if not item.name.isdigit():
                continue
            try:
                stat = (item / 'stat').read_text()
                tail = stat[stat.rfind(')') + 2:].split()
                proc[item.name] = (int(tail[11]) + int(tail[12]), stat[stat.find('(') + 1:stat.rfind(')')])
            except (OSError, ValueError, IndexError):
                pass
        for pid, (ticks, name) in proc.items():
            if previous and pid in previous['proc']:
                percent = (ticks - previous['proc'][pid][0]) / os.sysconf('SC_CLK_TCK') / (now - previous['procAt']) * 100
                if percent > 0:
                    top.append({'pid': int(pid), 'comm': name, 'cpuPercent': percent})
    mem = {k: int(v.split()[0]) for k, v in (line.split(':', 1) for line in Path('/proc/meminfo').read_text().splitlines())}
    disks = {}
    for line in Path('/proc/diskstats').read_text().splitlines():
        values = line.split()
        if values[2].startswith('nvme') and 'p' not in values[2]:
            disks[values[2]] = {'readSectors': int(values[5]), 'writtenSectors': int(values[9]), 'ioMs': int(values[12]), 'inFlight': int(values[11])}
    frequencies = []
    for path in Path('/sys/devices/system/cpu').glob('cpu[0-9]*/cpufreq/scaling_cur_freq'):
        try:
            frequencies.append(int(path.read_text()))
        except OSError:
            pass
    preferences = {}
    for name in ['scaling_governor', 'energy_performance_preference']:
        path = Path('/sys/devices/system/cpu/cpu0/cpufreq') / name
        if path.exists():
            preferences[name] = path.read_text().strip()
    busy = None
    if previous and total > previous['total']:
        busy = 100 * (1 - (idle - previous['idle']) / (total - previous['total']))
    row = {'kind': 'system', 'cpuBusyPercent': busy, 'loadavg': [float(v) for v in Path('/proc/loadavg').read_text().split()[:3]],
           'memAvailableKiB': mem['MemAvailable'], 'swapFreeKiB': mem['SwapFree'], 'disks': disks,
           'cpuFrequencyKHz': frequencies, 'energy': preferences, 'topCpu': sorted(top, key=lambda v: v['cpuPercent'], reverse=True)[:6], 'processCensusAgeSeconds': now - proc_at,
           'pressure': {k: Path('/proc/pressure/' + k).read_text().strip() for k in ['cpu', 'io', 'memory']}}
    return row, {'total': total, 'idle': idle, 'proc': proc, 'procAt': proc_at, 'top': top}


def wal_sample(library):
    path = library / 'library.sqlite3'
    row = {}
    for suffix, name in [('', 'dbBytes'), ('-wal', 'walBytes'), ('-shm', 'shmBytes')]:
        try:
            row[name] = Path(str(path) + suffix).stat().st_size
        except FileNotFoundError:
            row[name] = 0
    try:
        with Path(str(path) + '-wal').open('rb') as stream:
            header = stream.read(16)
        if len(header) == 16:
            row['checkpointSequence'] = struct.unpack_from('>I', header, 12)[0]
    except FileNotFoundError:
        pass
    try:
        with Path(str(path) + '-shm').open('rb') as stream:
            header = stream.read(100)
        row['consistentIndexHeaders'] = len(header) == 100 and header[:48] == header[48:96]
        if row['consistentIndexHeaders']:
            row['transactionCounter'], row['mxFrame'], row['databasePages'], row['nBackfill'] = [struct.unpack_from('<I', header, n)[0] for n in [8, 16, 20, 96]]
    except FileNotFoundError:
        pass
    return row


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    parser.add_argument('--data', required=True)
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ['--'] else args.command
    if not command:
        parser.error('command required')
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    root = Path(args.data)
    process = subprocess.Popen(command)
    previous, last_system, last_scan, previous_wal = None, 0, 0, None
    active, ordinal, known = None, 0, set()
    costs = []
    cpu_started, wall_started = time.process_time(), time.monotonic()
    try:
        with output.open('w') as stream:
            while process.poll() is None:
                start = time.monotonic()
                rows = []
                if start - last_system >= 1:
                    row, previous = system_sample(previous, start - last_system if last_system else 1)
                    rows.append(row)
                    last_system = start
                if start - last_scan >= .5:
                    for path in sorted(root.glob('run-*'), key=lambda p: p.stat().st_mtime_ns):
                        if path.name not in known:
                            known.add(path.name)
                            active, ordinal, previous_wal = path / 'library', len(known), None
                    last_scan = start
                if active:
                    row = wal_sample(active)
                    if row != previous_wal:
                        previous_wal = row
                        rows.append({'kind': 'wal', 'sample': ordinal, **row})
                cost = (time.monotonic() - start) * 1000
                costs.append(cost)
                for row in rows:
                    stream.write(json.dumps({'epochMs': time.time_ns() / 1e6, 'monotonicNs': time.monotonic_ns(), 'observerMs': cost, **row}) + '\n')
                stream.flush()
                time.sleep(max(0, .1 - (time.monotonic() - start)))
    finally:
        if process.poll() is None:
            process.send_signal(signal.SIGTERM)
            process.wait(timeout=30)
    costs.sort()
    Path(str(output) + '.summary.json').write_text(json.dumps({'exitCode': process.returncode, 'observations': len(costs), 'runsObserved': len(known),
        'observerMs': {'p50': costs[(len(costs) - 1) // 2], 'p95': costs[max(0, (len(costs) * 95 + 99) // 100 - 1)], 'max': costs[-1]},
        'observerVersion': 2, 'systemHz': 1, 'processCensusHz': .1, 'walHz': 10,
        'selfCpuSeconds': time.process_time() - cpu_started, 'wallSeconds': time.monotonic() - wall_started,
        'sqliteConnectionsOpened': 0, 'checkpointsRequested': 0}, indent=2))
    return process.returncode


if __name__ == '__main__':
    sys.exit(main())
