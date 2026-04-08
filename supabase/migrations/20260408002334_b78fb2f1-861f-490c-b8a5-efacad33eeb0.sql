UPDATE policies
SET target_premium = ROUND(target_premium / 12, 2)
WHERE target_premium IS NOT NULL
AND agent_id IN (
  SELECT id FROM profiles
  WHERE full_name ILIKE '%villalobos%'
     OR full_name ILIKE '%juan sanchez%'
     OR full_name ILIKE '%dariana%'
     OR full_name ILIKE '%aneisali%'
     OR full_name ILIKE '%nerio%'
);