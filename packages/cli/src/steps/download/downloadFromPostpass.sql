SELECT osm_type, osm_id, tags, ST_PointOnSurface(geom) AS geom
FROM postpass_pointlinepolygon
WHERE tags ? '{{ctx.config.merge.osm_key}}'
