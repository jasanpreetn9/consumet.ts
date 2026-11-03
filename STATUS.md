# Provider test status

**Observed:** 2026-11-03
**Scope:** Live Jest integration tests in `test/`


## Provider results

| Area | Provider/test | Result | Evidence and classification |
| --- | --- | --- | --- |
| Anime | AnimeKai | Inconclusive: test proxy unavailable / empty response | The test uses `https://whatever.fly.dev/get?url=`; searches returned empty arrays. Direct `anikai.to` probing also failed DNS from this environment. This is not enough evidence to call a parser change. |
| Anime | AnimePahe | Site unavailable | `getaddrinfo ENOTFOUND animepahe.si` in the test and direct probe. |
| Anime | AnimeSama | Site reachable, response changed or fixture stale | Requests completed, but the expected anime returned zero episodes and zero servers. |
| Anime | AnimeSaturn | Inconclusive: Jest worker failure | Jest reported four child-process exceptions before running the suite. A direct probe of the configured domain redirected from `animesaturn.cx` to `animesaturn.net` with HTTP 200, so this run does not establish a provider breakage. |
| Anime | AnimeUnity | Site unavailable | `getaddrinfo ENOTFOUND www.animeunity.co`; the provider currently targets `www.animeunity.to`, which also did not complete successfully in the suite. |
| Anime | HiAnime | Site unavailable | Repeated HTTP 522 responses from `hianime.to`; the provider reports the same upstream failure. |
| Anime | KickAssAnime | Site unavailable | `getaddrinfo ENOTFOUND kickass-anime.ro`. |
| Anime | Anime News Network | **Passed** | Suite passed. |
| Movies | DramaCool | Test proxy/environment unavailable | Requests failed with `ECONNREFUSED 127.0.0.1:443`, indicating the configured request path was refused locally rather than a confirmed provider HTML change. |
| Movies | FlixHQ | Site unavailable | Repeated HTTP 522 responses from `flixhq.to`; tests also exceeded their normal request time while the upstream was unavailable. |
| Movies | Goku | Site unavailable | Requests timed out/returned HTTP 522 while targeting `goku.sx`. |
| Movies | HiMovies | Site unavailable or domain repurposed | The configured site returned HTTP 404 in tests; a direct probe of `himovies.to` redirected to `survey-twist.com`, indicating the old endpoint is no longer serving the expected site. |
| Movies | NetMirror | Site unavailable | Provider reported `fetch failed` for its `net20.cc` request path. |
| Movies | SFlix | Site unavailable | `getaddrinfo ENOTFOUND sflix.ps`; direct probe could not resolve the domain. |
| Movies | Turkish123 | Inconclusive: transient upstream/network reset | Tests reported `read ECONNRESET`; this is a connection interruption, not evidence of changed selectors. |
| Movies | Comix | Response/API changed | The site itself responded, but provider requests returned HTTP 404, consistent with a changed route/API or stale endpoint. |
| Manga | MangaKakalot | Site protection/response changed | Search and info failed because the Cloudflare challenge persisted after retries; latest/ suggestions still passed. This is a reachable-site access/response change, not a DNS outage. |
| Manga | MangaHere | **Passed** | Suite passed. |
| Manga | MangaPill | **Passed** | Suite passed. |
| Manga | WeebCentral | **Passed** | Suite passed. |
| Light novels | NovelUpdates | Access unavailable/blocked | The site was reachable enough to respond, but access was denied (HTTP 403 during direct probing), so the test cannot validate parser behavior. |
| Metadata | AniList | Dependency/upstream failure | Basic AniList GraphQL operations passed, but anime-info and episode operations failed while the Hianime-backed enrichment path returned generic errors and HTTP 522. |
| Metadata | TMDB | Response/fixture mismatch | Search and several trending calls passed, but people trending returned an undefined collection and fixed TV/episode fixtures returned HTTP 404. This indicates stale assumptions or changed API/provider behavior rather than total site downtime. |
| Comics | Comics aggregate | **Passed** | Suite passed. |

## Validation commands

| Command | Result |
| --- | --- |
| `yarn test --runInBand` | Could not start initially because `yarn` was not installed in the environment. |
| `npx --yes yarn@1.22.22 install` | Passed; dependencies installed from the repository lockfile. |
| `npx --yes yarn@1.22.22 jest --maxWorkers=4 --verbose --testTimeout=30000` | Completed with 19 failed suites, 5 passed suites, 134 failed tests, and 28 passed tests. The 30-second timeout was used only to accelerate diagnosis; individual test files configure 120 seconds. |
| `curl -L -I -m 12` probes against failed provider domains | Confirmed DNS failures, redirects, HTTP 200/403 responses, and timeouts listed above. |
