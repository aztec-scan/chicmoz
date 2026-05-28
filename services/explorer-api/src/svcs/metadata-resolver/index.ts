import { logger } from "../../logger.js";

export type GovernanceProposalMetadata = {
  title: string | null;
  github_pr: {
    org: string;
    repo: string;
    number: number;
    title: string;
    merged: boolean;
    url: string;
  } | null;
  forum_link: string | null;
  description: string | null;
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? undefined;

const fetchGitHubPR = async (
  org: string,
  repo: string,
  number: number,
): Promise<{ title: string; body: string | null; merged: boolean }> => {
  const url = `https://api.github.com/repos/${org}/${repo}/pulls/${number}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "AztecScan/1.0",
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`,
    );
  }
  const data = (await response.json()) as {
    title: string;
    body: string | null;
    merged: boolean;
  };
  return { title: data.title, body: data.body, merged: data.merged ?? false };
};

const extractForumLink = (body: string | null): string | null => {
  if (!body) {
    return null;
  }
  const match = body.match(
    /https?:\/\/(?:forum\.aztec\.network|gov\.aztec\.network|[^\s)\]]*discourse[^\s)\]]*)[^\s)\]]*/i,
  );
  return match?.[0] ?? null;
};

const fetchIpfsContent = async (
  uri: string,
): Promise<string | null> => {
  const cid = uri.startsWith("ipfs://")
    ? uri.slice(7)
    : uri.includes("/ipfs/")
      ? uri.split("/ipfs/")[1]?.split("/")[0] ?? null
      : null;

  if (!cid) {return null;}

  const gateways = [
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`,
  ];

  for (const gateway of gateways) {
    try {
      const response = await fetch(gateway, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        return await response.text();
      }
    } catch {
      continue;
    }
  }
  return null;
};

const parseIpfsMetadata = (
  content: string,
): Partial<GovernanceProposalMetadata> => {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      title: (parsed.title as string | undefined) ?? (parsed.name as string | undefined) ?? null,
      description: (parsed.description as string | undefined) ?? (parsed.body as string | undefined) ?? null,
    };
  } catch {
    // Treat as markdown or plain text
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return {
      title: titleMatch?.[1] ?? null,
      description: content.slice(0, 500),
    };
  }
};

export const resolvePayloadMetadata = async (
  uri: string | null,
): Promise<GovernanceProposalMetadata> => {
  if (!uri) {
    return { title: null, github_pr: null, forum_link: null, description: null };
  }

  // GitHub PR
  const githubMatch = uri.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/,
  );
  if (githubMatch) {
    const [, org, repo, numberStr] = githubMatch;
    const number = parseInt(numberStr, 10);
    try {
      const pr = await fetchGitHubPR(org, repo, number);
      return {
        title: pr.title,
        github_pr: {
          org,
          repo,
          number,
          title: pr.title,
          merged: pr.merged,
          url: uri,
        },
        forum_link: extractForumLink(pr.body),
        description: pr.body?.slice(0, 500) ?? null,
      };
    } catch (e) {
      logger.warn(`Failed to fetch GitHub PR ${org}/${repo}#${number}: ${String(e)}`);
      return {
        title: null,
        github_pr: null,
        forum_link: null,
        description: uri,
      };
    }
  }

  // Forum link
  if (
    uri.includes("forum.aztec.network") ||
    uri.includes("discourse") ||
    uri.includes("gov.aztec.network")
  ) {
    return {
      title: null,
      github_pr: null,
      forum_link: uri,
      description: null,
    };
  }

  // IPFS
  if (uri.startsWith("ipfs://") || uri.includes("/ipfs/")) {
    try {
      const content = await fetchIpfsContent(uri);
      if (content) {
        const parsed = parseIpfsMetadata(content);
        return {
          title: parsed.title ?? null,
          github_pr: null,
          forum_link: null,
          description: parsed.description ?? null,
        };
      }
    } catch (e) {
      logger.warn(`Failed to fetch IPFS content for ${uri}: ${String(e)}`);
    }
    return {
      title: null,
      github_pr: null,
      forum_link: null,
      description: uri,
    };
  }

  // Fallback
  return {
    title: null,
    github_pr: null,
    forum_link: null,
    description: uri,
  };
};
