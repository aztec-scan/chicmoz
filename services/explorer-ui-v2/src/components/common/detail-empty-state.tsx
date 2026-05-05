import { type FC } from "react";
import {
  ConsoleHead,
  type ConsoleCrumb,
  Shell,
  type TopBarActive,
} from "~/components/layout";

interface Props {
  active?: TopBarActive;
  crumbs: ConsoleCrumb[];
  comment?: string;
  message: string;
}

/**
 * Loading / not-found shell for detail pages — Shell + ConsoleHead + a single
 * empty-state panel. Pages with multi-state empty UIs (e.g. tx-detail's
 * mined/pending/dropped split) inline their own panels instead of using this.
 */
export const DetailEmptyState: FC<Props> = ({ active, crumbs, comment, message }) => (
  <Shell active={active}>
    <ConsoleHead crumbs={crumbs} comment={comment} />
    <div className="panel">
      <div className="empty-state">{message}</div>
    </div>
  </Shell>
);
