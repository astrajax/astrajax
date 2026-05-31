import { GITHUB_DEFAULT_BRANCH, GITHUB_REPO } from './constants';

export function githubTreeUrl(repoPath: string): string {
    const trimmed = repoPath.trim().replace(/^\/+/, '').replace(/\/+$/, '');
    if (!trimmed) return `https://github.com/${GITHUB_REPO}`;
    return `https://github.com/${GITHUB_REPO}/tree/${GITHUB_DEFAULT_BRANCH}/${trimmed}`;
}

export function githubBlobUrl(repoPath: string, filename = 'build-pack-v1.md'): string {
    const trimmed = repoPath.trim().replace(/^\/+/, '').replace(/\/+$/, '');
    if (!trimmed) return `https://github.com/${GITHUB_REPO}`;
    return `https://github.com/${GITHUB_REPO}/blob/${GITHUB_DEFAULT_BRANCH}/${trimmed}${filename}`;
}
