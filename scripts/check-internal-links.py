from pathlib import Path
import re

root = Path('/home/ubuntu/miniroyal')
source = '\n'.join(p.read_text(errors='ignore') for p in (root / 'app').rglob('*') if p.suffix in {'.ts', '.tsx'})
hrefs = sorted(set(re.findall(r'(?:href|ctaLink)\s*=\s*["\'](/[^"\']+)', source)))
static_routes = {p.parent.relative_to(root / 'app').as_posix() for p in (root / 'app').rglob('page.tsx')}
blog_slugs = set(re.findall(r'"([a-z0-9-]+)": \{', (root / 'app/blog/[slug]/page.tsx').read_text()))
issues = []
for href in hrefs:
    path = href.split('?', 1)[0].split('#', 1)[0]
    if path.startswith('/blog/') and path.count('/') == 2:
        if path.rsplit('/', 1)[-1] not in blog_slugs:
            issues.append(f'BLOG_MISSING {href}')
    elif path.startswith('/admin') or path.startswith('/api') or path.startswith('/product/') or path.startswith('/category/') or path.startswith('/order/success/'):
        continue
    elif path not in {'/'} and not any(path == '/' + r or (r.startswith('[') and path.startswith('/' + r.split('/')[0])) for r in static_routes):
        # Dynamic/static route matching is intentionally conservative; report only obvious unknown roots.
        if path.count('/') <= 1:
            issues.append(f'ROUTE_UNKNOWN {href}')
print(f'INTERNAL_HREFS {len(hrefs)}')
print(f'BLOG_SLUGS {len(blog_slugs)}')
print('\n'.join(issues) if issues else 'NO_OBVIOUS_INTERNAL_LINK_ISSUES')
