const MAP = { n: 'node', w: 'way', r: 'relation' };

function htmlEscape(text: string) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export const Warnings: React.FC<{
  warnings: Set<string>;
}> = ({ warnings }) => {
  if (!warnings.size) return null;

  return (
    <>
      <h3>Warnings</h3>
      <ul>
        {[...warnings].map((w) => (
          <li
            key={w}
            // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml -- safeish
            dangerouslySetInnerHTML={{
              __html: htmlEscape(w).replaceAll(
                /\b([nwr])(\d+)\b/g,
                (_, type, id) =>
                  `<a href="https://osm.org/${MAP[type as never]}/${id}" target="_blank">${type}${id}</a>`,
              ),
            }}
          />
        ))}
      </ul>
    </>
  );
};
