-- Seeds the two programs, Cohort 2 and its graduates with their original certificate IDs.
-- Idempotent: safe to run more than once; never overwrites existing rows.
-- Run with:  npm run db:seed   (or inside the container: /app/migrate/seed.sh)

BEGIN;

INSERT INTO "program" ("id", "code", "name", "certificateTitle", "certificateDetail", "competencies", "updatedAt") VALUES
  ('seed_program_da', 'DA', 'Data Analytics',
   'Data Analytics Fundamentals with Excel, Power BI and Basic Python',
   'Using Excel, Power BI, statistics and basic Python to analyze real-world data and build dashboards.',
   ARRAY['Excel', 'Power BI Dashboards', 'Statistics', 'Basic Python', 'Capstone Project'], now()),
  ('seed_program_sd', 'SD', 'Software Development',
   'Software Development Fundamentals in Web Frontend and APIs',
   'Including a capstone project demonstrating frontend development proficiency in HTML, CSS and JavaScript with API integration.',
   ARRAY['HTML & CSS', 'JavaScript', 'DOM Manipulation', 'API Integration', 'Capstone Project'], now())
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "cohort" ("id", "name", "status", "endDate", "updatedAt")
VALUES ('seed_cohort_2', 'Cohort 2', 'COMPLETED', '2026-10-20', now())
ON CONFLICT ("name") DO NOTHING;

-- (certificate ID, graduate name, program code)
CREATE TEMP TABLE seed_graduates (number TEXT, name TEXT, program TEXT) ON COMMIT DROP;
INSERT INTO seed_graduates (number, name, program) VALUES
  ('DTA2064', 'Baboucarr Ceesay', 'SD'),
  ('DTA2059', 'Ya Jatou Drammeh', 'SD'),
  ('DTA2003', 'Alieu Hydara', 'SD'),
  ('DTA2016', 'Choro Jagne', 'SD'),
  ('DTA2025', 'Fatoumatta Jaiteh', 'SD'),
  ('DTA2013', 'Bilali Jallow', 'SD'),
  ('DTA2066', 'Momodou Boye Jallow', 'SD'),
  ('DTA2044', 'Muhammed K Jobarteh', 'SD'),
  ('DTA2027', 'Hawa Khan', 'SD'),
  ('DTA2038', 'Mary Elizabeth Leigh', 'SD'),
  ('DTA2048', 'Oumie Sambou', 'SD'),
  ('DTA2057', 'Tida Sanyang', 'SD'),
  ('DTA2018', 'Ebrima Sumareh', 'SD'),
  ('DTA2000', 'Abba Tamba', 'DA'),
  ('DTA2001', 'Aji Haddy Tamba', 'DA'),
  ('DTA2002', 'Alhassan Sowe', 'DA'),
  ('DTA2004', 'Alieu Laye', 'DA'),
  ('DTA2005', 'Alpha Jallow', 'DA'),
  ('DTA2006', 'Aminata Jasseh', 'DA'),
  ('DTA2007', 'Aminata Sanneh', 'DA'),
  ('DTA2008', 'Awa Marong', 'DA'),
  ('DTA2009', 'Awa Sowe', 'DA'),
  ('DTA2010', 'Babucarr Jobe', 'DA'),
  ('DTA2011', 'Banna Sambou', 'DA'),
  ('DTA2012', 'Bassiru Ndaw', 'DA'),
  ('DTA2014', 'Bukary Ceesay', 'DA'),
  ('DTA2015', 'Chamsu Peter Gomez', 'DA'),
  ('DTA2017', 'Demba Saidy', 'DA'),
  ('DTA2019', 'Ebrima Touray', 'DA'),
  ('DTA2020', 'Ellen Badjie', 'DA'),
  ('DTA2021', 'Fatima M Bah', 'DA'),
  ('DTA2022', 'Fatou Bojang', 'DA'),
  ('DTA2023', 'Fatou Kanyi', 'DA'),
  ('DTA2024', 'Fatoumatta D Khan', 'DA'),
  ('DTA2026', 'Hassan Bah', 'DA'),
  ('DTA2028', 'Hussein Jallow', 'DA'),
  ('DTA2029', 'Isatou Jaiteh', 'DA'),
  ('DTA2030', 'Isatou Jallow', 'DA'),
  ('DTA2031', 'Kebba Sohna', 'DA'),
  ('DTA2032', 'Kumba Secka', 'DA'),
  ('DTA2033', 'Mama Fanta Sisay', 'DA'),
  ('DTA2034', 'Mammot Secka', 'DA'),
  ('DTA2035', 'Mamud Ndure', 'DA'),
  ('DTA2036', 'Mansurr Bah', 'DA'),
  ('DTA2037', 'Mariama S. Bah', 'DA'),
  ('DTA2039', 'Modou Lamin Joof', 'DA'),
  ('DTA2040', 'Momodou Alpha Jallow', 'DA'),
  ('DTA2041', 'Momodou Lamin Jaiteh', 'DA'),
  ('DTA2042', 'Muhammed Barra', 'DA'),
  ('DTA2043', 'Muhammed Ceesay', 'DA'),
  ('DTA2045', 'Muhammed Lamin Jabbi', 'DA'),
  ('DTA2046', 'Muhammedbamba Manga', 'DA'),
  ('DTA2047', 'Naffie Gaye', 'DA'),
  ('DTA2049', 'Ousainou Sey', 'DA'),
  ('DTA2050', 'Ousman Mbowe', 'DA'),
  ('DTA2051', 'Sadiatou Jallow', 'DA'),
  ('DTA2052', 'Sadou Barry', 'DA'),
  ('DTA2053', 'Salieu Sambou', 'DA'),
  ('DTA2054', 'Salieu Secka', 'DA'),
  ('DTA2055', 'Salman Touray', 'DA'),
  ('DTA2056', 'Sanna Kebbeh', 'DA'),
  ('DTA2058', 'Wuyeh Sonko', 'DA'),
  ('DTA2060', 'Yahya Nyassi', 'DA'),
  ('DTA2061', 'Yusupha Jeng', 'DA'),
  ('DTA2062', 'Awo Secka', 'DA'),
  ('DTA2063', 'Bernard Sambou', 'DA'),
  ('DTA2065', 'Dabel Touray', 'DA'),
  ('DTA2067', 'Alieu O Cham', 'DA'),
  ('DTA2068', 'Musa Keita', 'DA');

-- A student is only created for certificate IDs that don't exist yet.
INSERT INTO "student" ("id", "fullName", "status", "programId", "cohortId", "updatedAt")
SELECT 'seed_student_' || g.number, g.name, 'GRADUATED',
       (SELECT "id" FROM "program" WHERE "code" = g.program),
       (SELECT "id" FROM "cohort" WHERE "name" = 'Cohort 2'),
       now()
FROM seed_graduates g
WHERE NOT EXISTS (SELECT 1 FROM "certificate" c WHERE c."number" = g.number)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "certificate" ("id", "number", "studentId", "issueDate", "updatedAt")
SELECT 'seed_certificate_' || g.number, g.number, s."id", '2026-10-20', now()
FROM seed_graduates g
JOIN "student" s ON s."id" = 'seed_student_' || g.number
ON CONFLICT DO NOTHING;

COMMIT;
