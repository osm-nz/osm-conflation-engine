import {
  type PropsWithChildren,
  createContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ConflateResult } from '@osm-conflation-engine/cli';
import { type Project, getAllProjects } from '../api/conflation.js';
import { FullPageError } from '../components/FullPageError.js';
import { FullPageLoading } from '../components/FullPageLoading.js';
import {
  type MissingStreets,
  getMissingStreets,
} from '../api/missing-streets.js';

export interface HomePageItem {
  count: number;
  region: string;
  regionFlag: string | null;
  osmKey: string | undefined;
  to: string;
  timestamp: string;
  operator: string;
  name: string;
  description: string;
  metrics: ConflateResult['countsByPhase']['conflated'];
  wikiPageLink: string;
  image: string | null;
}

export interface IDataContext {
  allProjects: Project[];
  homePageItems: HomePageItem[];
}
export const DataContext = createContext<IDataContext>(undefined!);
DataContext.displayName = 'DataContext';

export const DataWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const [allProjects, setAllProjects] = useState<Project[]>();
  const [extraInfo, setExtraInfo] = useState<MissingStreets.StatsFile>();
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    getAllProjects().then(setAllProjects).catch(setError);
    getMissingStreets().then(setExtraInfo).catch(console.error);
  }, []);

  const homePageItems = useMemo(() => {
    return [
      ...(allProjects || []).map((p): HomePageItem => ({
        count: p.metrics.countsByPhase.init.sourceDataset,
        region: p.metrics.config.metadata.region,
        regionFlag: p.regionFlagImage,
        name: p.metrics.config.metadata.name,
        description: p.metrics.config.metadata.description,
        osmKey: p.metrics.config.merge.osm_key,
        to: `/project/${p.refTag}`,
        timestamp: p.timestamp,
        operator: p.operator,
        metrics: p.metrics.countsByPhase.conflated,
        wikiPageLink: p.metrics.config.metadata.wiki_page,
        image: p.image,
      })),
      ...(extraInfo?.metadata || [])
        .map((extra): HomePageItem | undefined => {
          const lastRow = extraInfo?.rows.at(-1)?.regions[extra.code];
          if (!lastRow) return undefined; // e.g. if one dataset failed
          return {
            region: extra.code.replace('_', '-'),
            regionFlag: extra.icon,
            count: lastRow.totalDataset,
            name: `Missing Streets in ${extra.name}`,
            description: '',
            operator: extraInfo.operator,
            timestamp: extraInfo.lastUpdated,
            osmKey: undefined,
            to: `https://osm-nz.github.io/missing-streets/?region=${extra.code}`,
            wikiPageLink: extra.source,
            metrics: {
              delete: 0,
              edit: 0,
              perfect: lastRow.totalDataset - lastRow.issues,
              create: lastRow.issues,
            },
            image: extra.image,
          };
        })
        .filter((x) => !!x),
    ];
  }, [allProjects, extraInfo]);

  const ctx = useMemo<IDataContext>(
    () => ({
      homePageItems,
      allProjects: allProjects!,
    }),
    [allProjects, homePageItems],
  );

  if (error) {
    return (
      <FullPageError error={error}>
        Error downloading list of projects
      </FullPageError>
    );
  }

  // this one blocks the whole app from loading
  if (!allProjects) return <FullPageLoading />;

  return <DataContext value={ctx}>{children}</DataContext>;
};
