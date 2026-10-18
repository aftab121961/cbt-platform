-- Horizon CBT Supabase Seed SQL File
-- Contains Classes, Subjects, Chapters, Topics, and Initial Sample Questions

-- 1. CLASSES
INSERT INTO public.classes (id, name, display_order) VALUES
('c5000000-0000-0000-0000-000000000005', 'Class 5', 1),
('c6000000-0000-0000-0000-000000000006', 'Class 6', 2),
('c7000000-0000-0000-0000-000000000007', 'Class 7', 3),
('c8000000-0000-0000-0000-000000000008', 'Class 8', 4),
('c9000000-0000-0000-0000-000000000009', 'Class 9', 5),
('ca000000-0000-0000-0000-000000000010', 'Class 10', 6),
('cb000000-0000-0000-0000-000000000011', 'Class 11', 7),
('cc000000-0000-0000-0000-000000000012', 'Class 12', 8)
ON CONFLICT (id) DO NOTHING;

-- 2. SUBJECTS
INSERT INTO public.subjects (id, name, class_id) VALUES
('s9000000-0000-0000-0000-000000000001', 'Mathematics', 'c9000000-0000-0000-0000-000000000009'),
('s9000000-0000-0000-0000-000000000002', 'Science', 'c9000000-0000-0000-0000-000000000009'),
('sa000000-0000-0000-0000-000000000001', 'Mathematics', 'ca000000-0000-0000-0000-000000000010'),
('sa000000-0000-0000-0000-000000000002', 'Science', 'ca000000-0000-0000-0000-000000000010'),
('sb000000-0000-0000-0000-000000000001', 'Physics', 'cb000000-0000-0000-0000-000000000011'),
('sb000000-0000-0000-0000-000000000002', 'Chemistry', 'cb000000-0000-0000-0000-000000000011'),
('sb000000-0000-0000-0000-000000000003', 'Mathematics', 'cb000000-0000-0000-0000-000000000011'),
('sc000000-0000-0000-0000-000000000001', 'Physics', 'cc000000-0000-0000-0000-000000000012'),
('sc000000-0000-0000-0000-000000000002', 'Chemistry', 'cc000000-0000-0000-0000-000000000012'),
('sc000000-0000-0000-0000-000000000003', 'Mathematics', 'cc000000-0000-0000-0000-000000000012')
ON CONFLICT (id) DO NOTHING;

-- 3. CHAPTERS
INSERT INTO public.chapters (id, subject_id, name, chapter_number) VALUES
('ch100000-0000-0000-0000-000000000003', 'sa000000-0000-0000-0000-000000000001', 'Quadratic Equations', 3),
('ch100000-0000-0000-0000-000000000001', 'sa000000-0000-0000-0000-000000000002', 'Chemical Reactions and Equations', 1),
('ch110000-0000-0000-0000-000000000002', 'sb000000-0000-0000-0000-000000000001', 'Motion in a Straight Line', 2),
('ch110000-0000-0000-0000-000000000004', 'sb000000-0000-0000-0000-000000000001', 'Laws of Motion', 4),
('ch110000-0000-0000-0000-000000000101', 'sb000000-0000-0000-0000-000000000002', 'Some Basic Concepts of Chemistry', 1),
('ch120000-0000-0000-0000-000000000001', 'sc000000-0000-0000-0000-000000000001', 'Electrostatics', 1)
ON CONFLICT (id) DO NOTHING;

-- 4. TOPICS
INSERT INTO public.topics (id, chapter_id, name) VALUES
('tp100000-0000-0000-0000-000000000003', 'ch100000-0000-0000-0000-000000000003', 'Relationship between roots and coefficients'),
('tp100000-0000-0000-0000-000000000001', 'ch100000-0000-0000-0000-000000000001', 'Metal-acid reaction'),
('tp110000-0000-0000-0000-000000000002', 'ch110000-0000-0000-0000-000000000002', 'Equations of motion'),
('tp110000-0000-0000-0000-000000000004', 'ch110000-0000-0000-0000-000000000004', 'Newton''s Second Law'),
('tp110000-0000-0000-0000-000000000101', 'ch110000-0000-0000-0000-000000000101', 'Mole Concept'),
('tp120000-0000-0000-0000-000000000001', 'ch120000-0000-0000-0000-000000000001', 'Electric Potential')
ON CONFLICT (id) DO NOTHING;

-- 5. QUESTIONS
INSERT INTO public.questions (
  id, question_text, question_type, class_id, subject_id, chapter_id, topic_id, difficulty, source_type, exam_name, exam_year, option_a, option_b, option_c, option_d, correct_answer, solution, marks, negative_marks
) VALUES
(
  'q1000000-0000-0000-0000-000000000001',
  'If the roots of x² - 5x + 6 = 0 are α and β, then α + β is:',
  'mcq', 'ca000000-0000-0000-0000-000000000010', 'sa000000-0000-0000-0000-000000000001', 'ch100000-0000-0000-0000-000000000003', 'tp100000-0000-0000-0000-000000000003',
  'easy', 'practice', 'CBSE Sample', 2024,
  '5', '-5', '6', '-6',
  'A', 'For a quadratic equation ax² + bx + c = 0, α + β = -b/a = -(-5)/1 = 5.', 1, 0.25
),
(
  'q1000000-0000-0000-0000-000000000002',
  'Which gas is evolved when zinc reacts with dilute hydrochloric acid?',
  'mcq', 'ca000000-0000-0000-0000-000000000010', 'sa000000-0000-0000-0000-000000000002', 'ch100000-0000-0000-0000-000000000001', 'tp100000-0000-0000-0000-000000000001',
  'easy', 'practice', 'CBSE Board', 2023,
  'Oxygen', 'Hydrogen', 'Nitrogen', 'Carbon dioxide',
  'B', 'Zinc reacts with dilute HCl to form zinc chloride and hydrogen gas.', 1, 0.25
),
(
  'q1100000-0000-0000-0000-000000000003',
  'A body starts from rest and moves with constant acceleration 2 m/s². What is its velocity after 5 seconds?',
  'mcq', 'cb000000-0000-0000-0000-000000000011', 'sb000000-0000-0000-0000-000000000001', 'ch110000-0000-0000-0000-000000000002', 'tp110000-0000-0000-0000-000000000002',
  'easy', 'practice', 'JEE Main Sample', 2023,
  '5 m/s', '10 m/s', '15 m/s', '20 m/s',
  'B', 'Using v = u + at = 0 + (2)(5) = 10 m/s.', 1, 0.25
),
(
  'q1100000-0000-0000-0000-000000000004',
  'A block of mass 5 kg is acted upon by a net force of 20 N. What is its acceleration?',
  'mcq', 'cb000000-0000-0000-0000-000000000011', 'sb000000-0000-0000-0000-000000000001', 'ch110000-0000-0000-0000-000000000004', 'tp110000-0000-0000-0000-000000000004',
  'easy', 'practice', 'NEET Sample', 2022,
  '2 m/s²', '4 m/s²', '5 m/s²', '10 m/s²',
  'B', 'F = ma => a = 20 N / 5 kg = 4 m/s².', 1, 0.25
),
(
  'q1100000-0000-0000-0000-000000000105',
  'How many moles are present in 18 g of water?',
  'mcq', 'cb000000-0000-0000-0000-000000000011', 'sb000000-0000-0000-0000-000000000002', 'ch110000-0000-0000-0000-000000000101', 'tp110000-0000-0000-0000-000000000101',
  'easy', 'practice', 'School Exam', 2023,
  '0.5', '1', '2', '18',
  'B', 'Moles = 18 g / 18 g/mol = 1 mole.', 1, 0.25
),
(
  'q1200000-0000-0000-0000-000000000006',
  'The SI unit of electric potential is:',
  'mcq', 'cc000000-0000-0000-0000-000000000012', 'sc000000-0000-0000-0000-000000000001', 'ch120000-0000-0000-0000-000000000001', 'tp120000-0000-0000-0000-000000000001',
  'easy', 'practice', 'CBSE Board', 2024,
  'Coulomb', 'Ampere', 'Volt', 'Ohm',
  'C', 'Electric potential V = W/Q. SI unit is Volt.', 1, 0.25
)
ON CONFLICT (id) DO NOTHING;
