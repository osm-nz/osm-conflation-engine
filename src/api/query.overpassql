[out:json][timeout:25];
relation[type=route]({{bbox}})->.routes;
(
  rel(br.routes)[type=route_master];
  .routes;
  node[highway=bus_stop]({{bbox}});
  nwr[public_transport=platform]({{bbox}});
  node[public_transport=stop_position]({{bbox}});
  relation[public_transport=stop_area]({{bbox}});
);
out meta body;
