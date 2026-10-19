SELECT
  p.osm_type,
  p.osm_id,
  -- workaround because postpass doesn't include the type=* tag,
  -- see https://github.com/woodpeck/postpass-ops/pull/42
  -- this hack was generated with https://github.com/openstreetmap/id-tagging-schema/pull/3020#issuecomment-5933492594
  CASE
    WHEN r.tags->>'type' IS NOT NULL
      THEN p.tags || jsonb_build_object('type', r.tags->>'type')
    ELSE p.tags
  END AS tags,
  ST_PointOnSurface(p.geom) AS geom
FROM postpass_pointlinepolygon AS p
LEFT JOIN planet_osm_rels AS r ON p.osm_type = 'R' AND r.id = p.osm_id
WHERE p.tags ? '{{ctx.config.merge.osm_key}}'
