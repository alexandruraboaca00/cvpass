"""Independent acceptance oracle. Private values go only to the caller's pipe.

Not a production parser and never used to generate synthetic expected fixtures.
Namespaces/context and standard-library ElementTree are independent of saxes.
"""
import sys, json, base64, hashlib, xml.etree.ElementTree as ET

raw = sys.stdin.buffer.read()
if b"<!DOCTYPE" in raw or b"<!ENTITY" in raw:
    raise ValueError("DTD_NOT_ALLOWED")
root = ET.fromstring(raw)
ns = {"e": "http://www.europass.eu/1.0", "h": "http://www.hr-xml.org/3", "o": "http://www.openapplications.org/oagis/9", "r": "http://www.europass_eures.eu/1.0"}
def txt(node, path):
    found = node.find(path, ns)
    return "" if found is None else "".join(found.itertext()).strip()
def dates(node):
    def date(name):
        for child in node.iter():
            if child.tag.split("}")[-1] == name:
                for value in child.iter():
                    if value.tag.split("}")[-1] == "FormattedDateTime":
                        return (value.text or "").strip()
        return None
    ongoing = any(c.tag.split("}")[-1] in ("Ongoing", "CurrentIndicator") and (c.text or "").strip().lower() in ("true", "1") for c in node.iter())
    return {"start": date("StartDate"), "end": date("EndDate"), "ongoing": ongoing}
person = root.find("e:CandidatePerson", ns)
profile = root.find("e:CandidateProfile", ns)
if person is None or profile is None:
    raise ValueError("EXPECTED_CANDIDATE_PROFILE")
education = []
for item in profile.findall(".//e:EducationOrganizationAttendance", ns):
    education.append({"title": txt(item, "e:EducationDegree/h:DegreeName"), "organization": txt(item, "h:OrganizationName"), "period": dates(item), "web": next((txt(c, "o:URI") for c in item.findall(".//e:Communication", ns) if txt(c, "e:ChannelCode").lower() == "web"), "")})
work = []
for employer in profile.findall(".//e:EmployerHistory", ns):
    for position in employer.findall("e:PositionHistory", ns):
        work.append({"title": txt(position, "e:PositionTitle"), "organization": txt(employer, "h:OrganizationName"), "period": dates(position)})
groups = []
for group in profile.findall("e:Skills/e:SkillsGroup", ns):
    skills = [txt(c, "h:CompetencyName") for c in group.findall("e:PersonCompetency", ns)]
    groups.append({"name": txt(group, "e:Title"), "skills": skills})
native = ["".join(v.itertext()).strip() for v in person.findall("e:PrimaryLanguageCode", ns)]
foreign = []
for language in profile.findall("e:PersonQualifications/e:PersonCompetency", ns):
    if txt(language, "h:TaxonomyID").lower() != "language":
        continue
    scores = {}
    for d in language.findall("r:CompetencyDimension", ns):
        scores[txt(d, "h:CompetencyDimensionTypeCode")] = txt(d, "r:Score/h:ScoreText")
    foreign.append({"code": txt(language, "e:CompetencyID"), "scores": scores})
contacts = []
for c in person.findall("e:Communication", ns):
    contacts.append({"kind": txt(c, "e:ChannelCode"), "uri": txt(c, "o:URI"), "number": txt(c, "o:DialNumber"), "prefix": txt(c, "e:CountryDialing")})
photo = None
for a in profile.findall(".//r:Attachment", ns):
    if txt(a, "o:FileType").lower() != "photo":
        continue
    value = txt(a, "o:EmbeddedData")
    for _ in range(3):
        if value.startswith("data:"):
            photo = base64.b64decode(value.split(",", 1)[1])
            break
        try:
            decoded = base64.b64decode(value)
            if decoded.startswith((b"\x89PNG", b"\xff\xd8")):
                photo = decoded
                break
            value = decoded.decode("utf-8")
        except (ValueError, UnicodeError):
            break
result = {"education": education, "work": work, "groups": groups, "native": native, "foreign": foreign, "contacts": contacts, "photoSha256": hashlib.sha256(photo).hexdigest() if photo else None}
sys.stdout.write(json.dumps(result, ensure_ascii=False))
