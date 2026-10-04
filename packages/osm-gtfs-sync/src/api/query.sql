--
-- generated with https://github.com/openstreetmap/id-tagging-schema/pull/3020#issuecomment-5933492594
--
WITH bbox AS (
  SELECT ST_MakeEnvelope({{bbox}}, 4326) AS geom
),
-- every stop within the bbox
stops AS (
  SELECT DISTINCT p.osm_type, p.osm_id, p.tags, p.geom
  FROM postpass_pointlinepolygon p, bbox
  WHERE p.geom && bbox.geom
    AND (
      p.tags @> '{"public_transport":"platform"}'
      OR (p.osm_type = 'N' AND p.tags @> '{"highway":"bus_stop"}')
      OR (p.osm_type = 'N' AND p.tags @> '{"public_transport":"stop_position"}')
    )
),
relation_ids AS (
  -- route relations (which have geometry)
  SELECT l.osm_id AS id
  FROM postpass_line l, bbox
  WHERE l.osm_type = 'R' AND ST_Intersects(l.geom, bbox.geom)
  UNION
  -- other relations with no geometry (stop_areas and route_master)
  SELECT id
  FROM planet_osm_rels
  WHERE planet_osm_member_ids(members, 'N'::char(1))
    && ARRAY(SELECT osm_id FROM stops WHERE osm_type = 'N')
  UNION
  SELECT id
  FROM planet_osm_rels
  WHERE planet_osm_member_ids(members, 'W'::char(1))
    && ARRAY(SELECT osm_id FROM stops WHERE osm_type = 'W')
  UNION
  -- bus platforms can be relations e.g. if they have a flowerbed in the middle
  SELECT osm_id FROM stops WHERE osm_type = 'R'
),
relations AS (
  SELECT *
  FROM planet_osm_rels
  WHERE id = ANY(ARRAY(SELECT id FROM relation_ids))
    AND (
      tags @> '{"type":"route"}'
      OR tags @> '{"public_transport":"stop_area"}'
      OR tags @> '{"public_transport":"platform"}'
    )
),
-- lastly, get route_masters
route_masters AS (
  SELECT *
  FROM planet_osm_rels
  WHERE tags @> '{"type":"route_master"}'
    AND planet_osm_member_ids(members, 'R'::char(1))
      && ARRAY(SELECT id FROM relations WHERE tags @> '{"type":"route"}')
)

--
-- mimic the format of the overpass API
--
SELECT jsonb_build_object(
  'type', 'node',
  'id', osm_id,
  'lat', ST_Y(geom),
  'lon', ST_X(geom),
  'tags', tags
) AS element
FROM stops
WHERE osm_type = 'N'
UNION ALL
SELECT jsonb_build_object(
  'type', 'way',
  'id', w.id,
  'nodes', w.nodes,
  'tags', w.tags
)
FROM planet_osm_ways w
WHERE w.id = ANY(ARRAY(SELECT osm_id FROM stops WHERE osm_type = 'W'))
UNION ALL
SELECT jsonb_build_object(
  'type', 'relation',
  'id', r.id,
  'members', (
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', CASE m->>'type' WHEN 'N' THEN 'node' WHEN 'W' THEN 'way' ELSE 'relation' END,
        'ref', m->'ref',
        'role', m->>'role'
      ) ORDER BY i
    )
    FROM jsonb_array_elements(r.members) WITH ORDINALITY AS _(m, i)
  ),
  'tags', r.tags
)
FROM (SELECT * FROM relations UNION ALL SELECT * FROM route_masters) r
