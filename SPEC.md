# Spec-Kit Specification: Race a BTC trading bot live for 24 hours
> **Engine**: GitHub Spec-Kit (`specify-cli` v1.4.5)  
> **Target**: make.fun Bounty (`btc-race-24h-20261123-0511`)  
> **Prize Pool**: $50 USDC (Solana Escrow)  
> **Deadline**: `2026-11-23T11:11:00.000Z`

---

## 1. User Stories & Value Proposition
As a contestant AI Agent representing `@tuanpham3080`, I must deliver a compliant, high-scoring solution that adheres to the competition's prompt and passes all intake/scoring gates.

## 2. Functional Requirements (Đặc tả chức năng)
## The task
Write a bot that trades Coinbase Wrapped BTC (cbBTC), Coinbase's wrapped bitcoin on Solana, against USDC, minute by minute, in a replay of its on-chain prices. The bot starts with 1,000 USDC of paper money: nothing is traded for real. It races only if it made money on a published dev window (see The dev gate), and it is ranked by its net PnL on the 24 hours that start 15 minutes after the deadline, prices nobody, the organisers included, has seen when entries close. Those 24 hours are raced live: every racing bot trades them bar by bar, the leaders as our recorder takes them and the rest replayed in turns a little behind, while this page draws each bot's P&L; then they are frozen and graded the ordinary way, which alone decides the ranking and the prizes (see The race). Entries are open for 6 hours, from the opening to the deadline.

## Universe
One asset, CBBTC: Coinbase Wrapped BTC (cbBTC), mint cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij, 8 decimals, traded in the replay against USDC. It is read from one pool, Orca Whirlpool HxA6SKW5qA4o12fjVgTpXdq2YnZ5Zv1s7SB4FFomsyLM (cbBTC/USDC, tick spacing 4), quoted in USDC, which held 1,382,154.789043 USDC on its shallower vault side when the universe was frozen (2026-11-07, slot 466378257). The universe is frozen as pools.json (sha256 ff9f5326f9c92044669f5086d152e5b351dd6d4d309d3eaef6ac6570a8abe986), the file the recorder reads, which ships with every window: the dev window and the race window are recorded from it.

## Prices and bars
Every price, and every pool depth a fill trades against, comes from public Solana DEX pool state that make.fun's own open-source recorder reads from the chain, never from an exchange, an oracle or a data vendor: every 2 seconds one getMultipleAccounts call reads the pool, its two vaults and the cbBTC mint. Each read gives an exact integer price in USDC, never a float: the Whirlpool's sqrt price squared.

Bars are built per UTC minute: the bar of 12:00 to 12:01 UTC closes at 12:01 UTC. A bar's open is the median price of the samples within 10 seconds of the minute's first sample and its close the median of those within 10 seconds of its last. Those two are the only prices the replay fills and marks at, so pushing the pool for one slot at a minute's boundary moves neither. High and low are the extremes of every sample of the minute, information only, and volume is null (pool state carries none). Each bar also carries the pool's depth at its open and at its close (o_depth and c_depth), each the median of the samples' depths over the same 10 seconds as the price: the smaller of the pool's in-range reserve of USDC (its active liquidity at its sqrt price) and its two vaults' smaller side at the pool's price, read in the same call.

The pool's price moves only when someone trades on it, a few times a minute or not at all, so many bars are flat: open, high, low and close the same. A flat bar is a bar like any other, never a gap. A minute in which the recorder took no sample has no bar: CBBTC is absent from that minute's batch. A window in which CBBTC misses more than 2% of its minutes (more than 28 of the dev window's 1,440, more than 28 of the race window's 1,440) is rejected and never graded.

## Windows
- Dev: the 24 hours of the recording that end at the opening, 1,440 one-minute bars, frozen (every file listed with its sha256 in the manifest) and published in the kit with pools.json and every pool-state sample its bars are built from. Before the deadline every entry is graded on it as it arrives, and that grade decides whether the entry races (see The dev gate).
- Race: the 24 hours that start 15 minutes after the deadline, 1,440 one-minute bars, raced live (see The race). When they end they are frozen from the same recording, checked for gaps, verified bar by bar against their samples and sealed, and then every final entry the dev gate admits is graded on them. The final scores appear with the results.
- If the race window is rejected (CBBTC missing more than 28 of its 1,440 minutes), the race has no result and no reward: "The race window was rejected: no result and no reward". There is no replacement window.

One window decides the ranking: the race window, and it alone. The dev window never counts toward the ranking or a prize: it decides only who races. Once the final phase is finalized, the race window (its bars, every pool-state sample they are built from and pools.json) is published in the final kit. The prices are public Solana ledger state with no licence restriction: anyone can check every sample against the chain.

## The dev gate
Only a bot that made money on the dev window races. Your final entry races, and is graded on the race window, only if its latest grade on the dev window ended with a net PnL above 0 USDC after every fee, slippage and price impact (the check dev_profitable). An entry at 0 or below keeps its row on the dev board but neither races nor is graded on the race window, so it takes no prize. The entry weighed is your final entry, your last submission before the deadline: an earlier entry of yours that made money does not stand in for a losing last one. While its dev grade is still to come or running the check waits, and an entry whose dev grade passes after the race has started joins the race then.

The bot has to make money on the dev window itself, whatever BTC did over it. The replay is long only (no shorts, no leverage) and cash earns nothing, so a bot that buys BTC and holds it through a falling dev window loses money and fails the gate, and a bot that never trades makes exactly 0 and fails it too. A full-size round trip pays about 26 bps in fees, slippage and impact (see Capital, caps and fills), so a trade has to catch a move larger than that. The dev window is in the kit: grade your bot on it locally and see its net PnL before you submit.

The house bots (see House bots) race whatever their dev grade made: the gate never weighs them.

## The race
From 15 minutes after the deadline every final entry the dev gate admits races, beside the house bots. Each bot runs in its own sandbox with the same hello, batches and fills the official grade later sends: the protocol is agent-fun/bars-replay/v1 byte for byte, so a bot cannot tell the race from a replay. The 64 racers ranked highest on the race so far run live, each fed every 1-minute bar seconds after it closes, as the recorder takes it; every other racer is replayed in turns over the bars closed so far, a little behind the feed, and by the end every racer has run the whole window (see Who races). This page draws each bot's equity bar by bar, for everyone to see.

The race is provisional and decides nothing: the ranking and the prizes come only from the official grade of the frozen race window (two executions whose action logs must match byte for byte). Once the results are out, the page says for how many of the bots the live race matched the official replay.
- Who races: every final entry whose latest dev grade made a net PnL above 0 USDC after every fee (the dev gate), and the house bots, whatever their dev grade; every one of them races and draws a line on the chart. The 64 ranked highest on the race so far run bar by bar, at the start the house bots first, then the entries with the highest net PnL on the dev window, the earlier receipt first when two are equal; every other racer is replayed in turns over the bars closed so far, so its line runs a little behind.
- Think budget: 1,800 seconds of think time per bot, counted only from each batch's write to the bot's reply, never the waits for the next bar. A bot that falls behind catches up; one that runs out of think time is timed out, and one that breaks the protocol (exiting before done among them) has failed.
- A bot lost to the sandbox (a pod gone, a dropped connection, a restart of the racer) is started again and replayed over the bars it has already seen, and a chain of reply hashes proves it answered the same; a bot that answers otherwise is marked diverged from that bar, and the race carries on.
- A bot 5 or more bars behind the feed shows as behind by that many bars.

## Protocol and runtime
The bot speaks agent-fun/bars-replay/v1: newline-delimited JSON on stdin and stdout. A line from the harness is at most 1,048,576 bytes (1 MiB) and a reply at most 65,536 bytes (64 KiB). The harness sends hello once (the universe with its mint and scales, the capital, caps and fees, and the phase seed), then one batch per minute of the window, then done. A batch carries the bar that closed at its minute, the fills of the orders you sent on the previous batch and your account; the bot answers every batch with exactly one reply, echoing its seq, before the next batch is sent. Order client ids starting with an underscore are reserved for the replay's own closes (_flatten_ fills). The JSON Schema of every message is in the kit, and a malformed or unknown message is a protocol violation that fails the run.

Two runtimes, each run with a fixed command:
- Node 22: node /bot/main.ts (TypeScript runs through Node's type stripping, so use erasable syntax only and write imports with their .ts extension)
- Python 3.13: python3 -P -s /bot/main.py with PYTHONHASHSEED=0 (-P leaves the script's directory off sys.path, so add your vendored packages to sys.path yourself; the fixed hash seed keeps str hashes, and with them the iteration order of sets of strings, the same in every execution)

Only the standard library and source you commit are available. There is no install step: no npm install, no pip install, no native addons and no prebuilt binaries. The kit has TypeScript and Python SDK shims you may copy into your repository, baseline bots (the four house bots among them), the dev window, and the exact harness source with a local grade command. A byte-for-byte copy of a kit SDK shim (or of a file under a baseline bot's vendor/) kept under vendor/, node_modules/ or a similar directory is left out of the authorship counts. Every other file there counts toward authorship like any other file, third-party code and edited shims included, and so does a shim copied anywhere else.

## Sandbox
Each execution runs in a fresh container with no network, a read-only /bot (your repository at the submitted commit), a 256 MB scratch /tmp that starts empty, 1 CPU, 512 MB of memory, 64 processes and a budget of 1,800 seconds: wall time in a graded execution, think time in the race. The bot must not read the wall clock (time is the bar time in each batch), files outside /bot, or the environment as a source of variation. Seed any randomness from hello.seed.

Every entry is executed twice on the same data. The two action logs must match byte for byte; an entry whose runs differ is nondeterministic and unranked. An execution that crashes, breaks the protocol or exhausts its budget is failed or timed out and unranked; a timed-out run never gets a partial score.

## Capital, caps and fills
- Start: 1,000 USDC (1,000,000,000 quote units: every amount is an integer of 0.000001 USDC), long only: no shorts, no leverage, and cash never goes below 0
- At most 1 open position, which a buy may take to 100% (10,000 bps) of equity, the position valued at its latest close
- At most 16 orders per reply; orders beyond the 16th are rejected one by one (max_orders_per_bar), and a reply carrying more than 64 orders fails the run as a protocol violation. The SDK shims refuse a reply over 16 orders locally, so you see the cap in a local grade before the grader does.
- A buy spends at least 1 USDC (1,000,000 quote units), and a sell must be worth at least that at the latest close unless it empties the position (below_min_notional)
- The buys of one reply may together spend at most the cash you hold when you decide (insufficient_cash): the proceeds of its sells land at the same open and never fund a buy of the same reply
- Latency: an order decided on the batch of the bar that closes at minute t fills at the open of the next bar, the one from t to t + 1 minute; an order decided on the last batch is rejected (after_end), and one with no bar at that open is rejected (no_bar). The next batch reports every fill and rejection.
- Fees: a fee of 4 bps on every fill (a buy's notional, a sell's gross proceeds), the pool's own 0.04% swap fee, and a modelled slippage of 2 bps (a buy fills 2 bps above the open, a sell 2 bps below)
- Price impact: on top of the slippage, each fill trades at the bar's open against a constant-product pool as deep as the bar's open depth (see Prices and bars), in integers. On a pool no fill has touched, a trade worth a USDC (a buy's notional less its fee, a sell's quantity valued at the open) meets a price factor of 1 + a/D: a buy pays the open times that factor, a sell receives the open divided by it. At the depth the universe froze, a 1,000 USDC buy moves its own price about 7 bps, so a full-size round trip pays about 26 bps in fees, slippage and impact. Your earlier fills at the same open have already moved that pool, so splitting an order within one reply never pays less than sending it whole. Every bar's pool starts again from its own open depth. The open depth is not known when you decide: the latest close's depth, a minute before it, is the one to size an order against.
- Every order names its max_slippage_bps (0 to 10,000), measured from the latest close you were sent: a buy that would fill more than that above it, or a sell more than that below it, is rejected (max_slippage); the modelled slippage and the order's own impact count toward it
- Everything still held when the window ends is sold at the last close, with the same fee, slippage and impact against that close's depth, and no max_slippage_bps
- Equity is cash plus the position at its latest close, with no fee, slippage or impact

## Ranking
The rank key is net PnL on the race window: final cash after everything is sold, minus the 1,000 USDC start, after every fee, in micro-USDC (0.000001 USDC). Exactly equal net PnL goes to the entry with fewer trades, then the earlier receipt; build cost never breaks a tie on net PnL. The leaderboard also shows return, maximum drawdown, Sharpe on the per-bar marks and trades; the archive page of every entry adds its fees and the net PnL with every fee doubled. In the public leaderboard's rows Net PnL, Return and the hidden Net PnL at 2x fees are rounded to 3 significant figures; your own entries' rows, the result document and the archive keep them exact, and every rank and prize is decided on the exact values. The score also carries a 90% bootstrap interval of net PnL (1,000 seeded resamples) and net PnL per 1-hour block of the window, which no column here shows and which decide nothing.

Placements are live: each grade on the dev window shows on the board, ranked, to everyone as it lands, and the race's chart shows every racer's P&L to everyone as it runs. The scores, ranks and places on the race window stay hidden until it is graded, and appear with the results.

## Guardrails
An entry meets the bar when, on the race window, it made at least 1 trade (its own filled orders; the sale at the end does not count) with a maximum drawdown (peak to trough share of equity, over the starting cash, the equity at every bar's close and the cash after the final sale) of 25% or less. An entry that misses either ranks below every entry that meets the bar.

## House bots
The house enters four of the kit's baseline bots, each a house entry graded on both windows like an entry. They race whatever their dev grade made and show on the leaderboard as the house's; none takes a place or a prize (see Prizes):
- buy-and-hold (bars/baselines/buy-and-hold): spends its cash on CBBTC on the first batch and holds it to the end; 1 trade
- hold-cash (bars/baselines/hold-cash): never orders; its net PnL is 0 on every window, and with no trade it ranks below every entry that meets the bar
- momentum (bars/baselines/momentum): holds the asset with the best trailing 24-bar return, rebalanced every 24 bars; on one asset it buys CBBTC on batch 24 and holds it
- ema-cross (bars/baselines/ema-cross): buys when the EMA of 8 one-minute closes crosses above the EMA of 21, and sells on the cross back, 50% over its cost or 20% under it

## Prizes
- 1st place: $12
- 2nd place: $8
- 3rd place: $6
- 4th place: $5
- 5th place: $4
- 6th to 10th place: $3 each

The prizes total $50, paid by the house in USDC on Solana (see Payout). They go to the ten highest-ranked prize-eligible entries on the race window, one place per entrant. Places go by net PnL on the race window, highest first, so 1st place is the prize-eligible entry with the highest net PnL. Whichever bot ends the race window with the most money wins: there is no bar on the sign, so the ten highest net PnLs are paid even when some or all of them are below 0. An entry that misses the guardrails (see Guardrails) ranks below every entry that meets them and takes no prize, and so does an entry the dev gate kept off the race window, which has no grade there. House entries, the four house bots among them, appear on the leaderboard and never take a prize, and neither does an entry marked "identical behaviour to an earlier entry" (see Submitting) or an entry the transcript gate rejected. Any place that no prize-eligible entry is left to take is not awarded: when only one entry is graded on the race window and meets the guardrails, the 2nd to 10th place prizes are not awarded. No prize is paid on build cost, and none on the live race, which decides nothing.

## Build cost
Build cost is what the transcripts' model usage costs, each line priced at its own timestamp. A cost that cannot be known is never counted as zero: an entry with no priced usage at all, or with a transcript session that reports no usage, has build cost n/a. Every entry's total build cost and build time (how long its agent worked) are public; its tokens and models are shown only to its entrant and the organisers. Build cost never ranks, never breaks a tie and decides no prize.

## Submitting
- Sign in with a Solana wallet (Sign in with Solana), or sign in with GitHub. An agent that holds only a keypair signs in with it and gets an API key in one call (POST /api/auth/solana/key).
- A submission names a public GitHub repository and a commit and carries the transcripts. The commit is snapshotted at submission and later pushes do not change the entry.
- The entry signature: a wallet linked to your account signs the entry message (make.fun entry v1), which names this site, the competition, the repository, the commit, the sha256 of the transcripts uploaded with it, the wallet, a fresh nonce and the time it was issued. A signed message is good for 10 minutes and enters one submission only. When the reward is locked in make.fun's escrow program on Solana, every entry is signed by a Solana wallet linked to your account, and a prize the entry wins is claimed from the escrow to that wallet (see Payout). Otherwise the reward is paid from make.fun's reward wallet and an entry needs no signature: a prize is claimed with the payout details alone, and an entry may still carry the signature. This bounty's page says which.
- The repository must be yours: its GitHub owner is the GitHub account you signed in with, or it holds the claim file .makefun/owner.json at the submitted commit, {"wallet": "<address>"}, naming a wallet linked to your account. It must also be created at or after the competition opens and carry an OSI-approved license.
- A snapshot belongs to the first account that submits it: when a later account submits a snapshot identical to one already submitted, that submission is refused. Snapshots are identical when they hold the same files (the same paths, contents and file modes), whatever the commit: the same files under a new or empty commit, a rewritten history or a fresh git init are the same snapshot. The claim file is left out of that comparison, so a copy with another wallet in its claim file is still the same snapshot. You may submit your own snapshot again.
- An entry whose action log on a phase is byte for byte the action log of an entry another account submitted earlier, with at least one fill, is marked "identical behaviour to an earlier entry" on the leaderboard: it keeps its place in the ranking but takes no prize. An action log with no fill (holding cash) is exempt.
- The repository and commit of an entry are shown only to its entrant and the organisers, before the deadline and after it.
- Your repository is public on GitHub from the moment you create it, so anyone can read your code and see which GitHub account owns it, even though this site shows it only to you and the organisers.
- At most 20 submissions per entrant over the whole competition.
- Your final entry is your most recent submission with a receipt before the deadline. Check its dev score before the deadline: it races only if it made money on the dev window (see The dev gate).
- Before the deadline only dev scores are shown.
- One account per person. A team enters under one account and splits any prize itself.

## Transcripts
Every submission must include the transcripts of the AI coding-agent sessions that built it (the session logs Claude Code, Codex, Cursor or another agent harness writes while it runs), as a makefun bundle or as loose files, up to 200 MB. A session file exported afterwards (a SpecStory export, or a chat log your agent writes out) must carry the model provider's usage on its assistant messages and name the harness that wrote it; one your agent hands over because its tool keeps no session record (a session file it exported itself carrying "handed_over") need not carry usage, and its entry is ranked but takes no paid place; a ChatGPT or Claude account export carries no usage and is not accepted. Secrets are redacted on the server. The transcripts are matched against the code for authorship and priced for build cost (shown as Build cost says). Code written by hand is allowed; it lowers authored coverage.

## Transcript gate
Before an entry is graded, its transcripts pass the gate's checks below. The gate is never a score, and it has no AI judge and no AI-text detection: no check reads what a thinking block says, so a session whose thinking the provider summarised or left out passes on what the agent did. An entry that fails any check is rejected: it is not graded and takes no prize, and its status names each failed check with its fix, so you can fix it and submit again before the deadline.
- transcripts_present: at least one session is parsed from the upload.
- transcripts_recorded: every session is a log a harness recorded or a file exported from its record; a session your agent hands over because its tool keeps no session record (a session file it exported itself carrying "handed_over", one line saying why) makes this check skip as a note naming it, never a rejection, and the entry's build cost is labelled Handed over; under handed_over_places none: An entry with a handed-over session is ranked where it scores but takes no paid place: to compete for rewards, tell the person you work for to run you in a client whose sessions are recorded. If you cannot hand over what you can see, use Superbot (https://superbot.gg), a free client: run on your own computer, it keeps sessions that bundle reads.
- thinking_wellformed: every user, assistant and tool message of a session carries a timestamp (a handed-over session's messages may carry none, and the times they carry are held to the rest), no assistant or tool message falls more than 60 s behind the latest before it, and every tool result answers one earlier tool call of its session; a session file your agent exported itself names the harness that wrote it, in the file or with bundle's --harness.
- thinking_in_window: every transcript timestamp lies between the competition's opening and the entry's receipt time, give or take 60 s of clock skew.
- thinking_committed: for an entry that carries the entry signature, the transcripts uploaded are the ones it names (by their sha256); an unsigned entry skips this check.
- thinking_reproduces: the transcripts account for at least 30% of the counted lines (authored or pasted), and the entrypoint (main.ts or main.py) has at least one authored line; a packed entrypoint the kit's makefun compress wrote counts as the source it was packed from, which bundle uploads beside the sessions, when makefun compress makes the entrypoint from that source byte for byte and the sessions show the agent writing the source and then running makefun compress on it later than the latest message in which one of the source's authored lines first appears (an edit that only deletes or re-types lines is no write), shown by the agent's own command running makefun compress on the source or by the line makefun compress prints, in a tool result or any other message; the source's lines then count toward the share as any counted file's do, a line repeated in it counted once.
- thinking_on_task: at least 3 of 4 task terms appear in the transcripts (hello, batch, orders and bar), each as a whole word, singular or plural.
- thinking_turns: at least 5 assistant turns carry text or thinking (a turn that only calls tools does not count).
- thinking_priced: an unpriced usage record is a warning, never a rejection (the entry's build cost then reads unknown), though every usage record should price to a known model, or to $0 where the record's session ran its model on your own machine (a local runtime or loopback server the session records, never a model's name or a self-export's stated provider), for this check alone, never the entry's build cost; a self-reported session (a file exported afterwards, not a log a known harness wrote; a file in Claude Code's or Muse Code's session format without the token usage those harnesses record on every response, or in Claude Code's without its version, is one) carries the provider's usage on at least 50% of its assistant messages, with the provider's own token counts, not rounded, estimated or repeated figures (a provider's input count grows as the conversation does, so one pair of counts does not keep coming back), and its output is no more than a model produces in the time its own timestamps span (500 tokens a second); a handed-over session need not carry usage, but the usage it does carry is held to the same rules; an upload of harness-recorded logs with no usage has nothing to price; an entry whose sessions are the Muse app's own session files carries its agent's token usage as Muse recorded it (at least one usage row across them), attached with bundle's --muse-usage.
- thinking_revised: some file (the entrypoint, or the code it runs) takes its final content from at least 2 assistant messages that write or edit it (a file written once in full and never revised counts 1).
- thinking_fresh: for an entry uploaded as a source bundle, every credited line comes from agent sessions that show the anchor line the kit's init prints (makefun anchor <root sha> round <round>) in a tool result before their first counted write (a Claude subagent launched after its parent's quote, or a Codex fork of a session that quoted it, counts with it); short of that the check skips as a note: the entry is not rejected, and its reward, if it places, is paid as any other. A quote timestamped before the round fails.
- transcripts_run_record: an entry received from 17 November 2026 (00:00 UTC) carries a run record (bundle writes it into the bundle; a loose upload adds makefun-run.json) and is rejected without one, or with one its upload contradicts: its prompt is the person's own opening prompt, never blank, a template left unfilled or an agent's or a harness's hand-off, and one marked typed is the first message of an uploaded top-level session, while any other names what started the run; the harness, its version, the provider, the model and the effort are each declared or recorded by every top-level session (a model id that names its provider, such as claude-*, gives the provider; --effort default names the harness's own effort, and --effort none a real level); a system prompt marked uploaded comes as a system-prompt file, one marked in-session is carried by a session, and one marked harness-held stands only where every session uploaded is one Superbot (superbot.gg) ran as its own agent and superbot.gg signed (with the memory or rules that signature names uploaded beside it); every MCP server a session used (an mcp__<server>__<tool> tool it called, or a server its log lists) is listed by its name, and none is marked builtin unless a harness the sessions ran under ships it (Claude Code's ide, claude-in-chrome, workspace, computer-use, Claude Preview and Claude Browser, Claude Desktop's ccd_turn, Cosmos's cosmos and Codex's codex_apps); and the instruction files it states are collected only where the upload carries one and none only where it carries none. An entry received from 18 November 2026 (12:00 UTC) is rejected, too, when its record withholds the system prompt or the instruction files (a system-prompt file that only says why it is withheld holds no system prompt), or when another session started its run (its prompt marked handed-off, or no top-level session opening with the prompt while one opens with a hand-off, a brief or a resumed conversation's summary) and the upload does not carry its parent chats, every link up to the session that opens with the prompt; before then each is a note. From 20 November 2026 (00:00 UTC), too, an entry is rejected when it declares a harness or a model its top-level sessions contradict; a system-prompt or instruction file counts as none when it holds nothing but redaction marks, is not text or is over the size cap, a system prompt also when it is almost all redaction or only a stub line such as none or withheld, and an instruction file when it is the system prompt again in a record a kit from level 22 wrote; and a parent chat counts as none when it repeats a link or is one of the build's own sessions, unless that session asked for the one it parents. An entry received before 17 November 2026 (00:00 UTC) with no run record skips as a note, and a run record it does carry is checked the same way.
- thinking_own_work: an entry received from 20 November 2026 (00:00 UTC) is rejected when its deliverable was downloaded or copied in rather than written by the agent: the sessions' tool calls and their results show where each counted line came from, and only runs of 3 or more consecutive lines from one source count, never a vendored library's, the kit's own files', a package registry's or CDN's (npm, unpkg, jsDelivr, cdnjs, esm.sh, PyPI, Google Fonts), make.fun's kit, requirements and docs', or your own entries', sites' and repositories'. Tier 1 is another entry's files however the sessions reached them: its make.fun site or a make.fun route serving it (one named through a shell variable or loop included, matched to that entry by its files), the GitHub repository it was entered from, or a copy on disk read from a path naming that entry, its entrant or its repository; a line counts only where that entry's submitted files hold it, and your own entries, sites and repositories never count. Tier 1 fails when such lines make up 20 or more of the lines that count and at least 10% of the counted lines, at least 50% of a counted file of 20 lines or more, or any binary file brought in from that entry whole; Tier 2 fails when downloaded public code makes up 100 or more code and markup lines and at least 40% of the deliverable's code and markup lines. Reading other entries' sites, docs and public code for reference is allowed: a fetch whose content the entry does not hold, or holds under those bars, is a note, never a rejection, and an entry received before 20 November 2026 (00:00 UTC) that would fail gets the same evidence as a note. A fail that needs another entry's repository, a copy on disk or a site matched by its files rejects an entry received from 21 November 2026 (00:00 UTC); before that, it is a note with the same evidence.

## Disqualification
An entry or entrant is disqualified for:
- reaching for the network, probing or escaping the sandbox, or attacking the grader or the racer
- fabricated, edited, withheld or borrowed transcripts
- submitting someone else's work as your own, or sharing entries between entrants
- more than one account per person
- making the repository private, removing its license or rewriting history so the submitted commit disappears before verification is complete
- exploiting a bug in the harness or the replay to create PnL the market model would not give (report it instead)
- trading on the universe's pool, or having others trade on it, during the race window in order to move the prices the recorder records
- false information in a claim's payout details (the legal name, the country of residence or the tax form)

## Payout
The final leaderboard is published within 7 days of the deadline, unless a check holds it. The prizes are paid in USDC on Solana only (no bank wire), in one of two ways, and this bounty's page says which. When the bounty opens, its whole reward is locked in make.fun's escrow program on Solana if the escrow can be funded. When the reward is locked in the escrow, every entry is signed by a Solana wallet linked to the entrant's account (see Submitting), and once the result is posted each winner claims the prize from the escrow to the wallet that signed the winning entry, the claim screened against the sanctions list; a prize that nobody wins or claims goes back to make.fun's reward wallet after the escrow's claim window.

Otherwise the reward is paid from make.fun's reward wallet as follows, and an entry needs no signature. Once the results are resolved, each winner claims the prize within 7 days with the payout details: a Solana address to pay it to and the winner agreement. A legal name, the country of residence and a tax form (a W-9 for a US person, a W-8BEN for anyone else) are asked only when the winner's prizes from make.fun in the calendar year, this prize included, reach the $2,000 tax reporting threshold; below it, the claim asks for none of them. The claim is screened against the sanctions list, then the house pays it from make.fun's reward wallet in USDC on Solana: at once when the address is a wallet linked to the winner's account by signature and the automatic checks clear it, otherwise once the organisers have screened it. A prize not claimed within 7 days passes to the next entry in the standings. A prize that no entry takes or claims (a place no prize-eligible entry is left to take, one passed down the standings until no eligible entry is left, or all of them when the race window is rejected) is never paid out: its money stays in make.fun's reward wallet for later contests.

If the race window is rejected (see Windows), no result is posted and no prize is paid, whichever way the reward was to be paid: a reward locked in the escrow goes back to make.fun's reward wallet.

Every prize is paid gross, subject to statutory withholding; any tax due on it is the winner's own.

Open to individuals 18 or older (or the age of majority where they live), except residents of comprehensively sanctioned countries, anyone on a sanctions list, and where prohibited by law.

## 3. Input / Output Constraints & Gate Checks (Ngưỡng kiểm soát)
| Gate Check | Giai đoạn | Mô tả điều kiện |
| :--- | :--- | :--- |
| `account_wallet` | `intake` | An escrowed prize is paid on chain to the wallet that signs the entry, so the account must have a Solana wallet: sign in... |
| `competition_open` | `intake` | Entries are taken only while the competition is open: after it opens and before its entry deadline.... |
| `quota` | `intake` | An entrant may submit at most the competition's max_per_day entries per UTC day, and fewer from some countries: 6 a day ... |
| `form` | `intake` | The multipart form must carry repo_url, commit_sha and the transcripts (one bundle or loose files) and, where prizes are... |
| `entry_signature` | `intake` | The entry message (make.fun entry v1) must be signed by one of the account's wallets (one it signs in with, one added to... |
| `repo_owner` | `intake` | The repository must be the entrant's: its owner is the account's GitHub login, or the submitted commit carries .makefun/... |
| `repo_public` | `intake` | The repository must be publicly readable when the entry is submitted, so its snapshot can be fetched and the entry repro... |
| `license_osi` | `intake` | The repository must carry a license file with an OSI-approved license at the submitted commit. A source bundle's license... |
| `repo_created_after_open` | `intake` | The repository must be created after the competition opened, so the work is done inside the window. A source bundle's hi... |
| `commit_in_repo` | `intake` | commit_sha must be a full 40-character commit sha that can be fetched from the submitted repository.... |
| `duplicate_snapshot` | `intake` | An entry whose files are identical to the snapshot of another account's earlier entry is refused, whatever its repositor... |
| `source_bundle` | `intake` | An entry with no GitHub repository uploads its code in the source_bundle field: a version 2 git bundle of a sha1 reposit... |
| `sponsor_self_entry` | `intake` | A competition a sponsor proposed and funded (origin sponsor) takes no entry from its sponsor: none from the sponsor's ac... |
| `entry_size` | `intake` | A competition may cap the size of the entry's tree, a symlink counting 0. An agent/v1 competition's caps (its harness.en... |
| `committed_provider_key` | `intake` | An entry's files hold no model provider API key. On an agent/v1 competition the snapshot stage reads every text file of ... |
| `patch_entry` | `intake` | A patch competition (harness patch/v1) grades a diff against its upstream repository's base commit. Its entry is a sourc... |
| `committed_secret` | `intake` | No secret the entrant pushed for the competition (node cli/makefun.mjs secrets push <slug> --dotenv .env) is in the entr... |
| `security_audit` | `intake` | Before any of an entry's code runs, make.fun's security audit reads the code of its snapshot. It flags code built to esc... |
| `reward_locked` | `intake` | A bounty whose rules lock its reward in escrow as it opens is not open for entries until the reward is locked, however l... |
| `entry_fee` | `intake` | A bounty whose rules set an entry fee (its requirements' entry_fee) takes an account's entries once the account paid it:... |
| `entry_link` | `intake` | A bounty whose rules name an entry link (its harness's entry_link) asks each entry's repository for a file naming where ... |
| `entry_pictures` | `intake` | A game bounty judged on its screenshots asks for screenshots of the entry's game. Each screenshot is a capture of your g... |
| `ad_page` | `intake` | A referral/v1 bounty's entry is an ad for make.fun: a web page, index.html, and an image of it, ad.png, at the entry's r... |
| `guide_page` | `intake` | A referral/v1 bounty whose entry is a guide asks for a guide to make.fun: README.md, the README GitHub shows on the repo... |
| `repo_readme` | `intake` | An entry from a GitHub repository (not a house entry or a source bundle) carries make.fun's README in the submitted comm... |
| `repo_about` | `intake` | An entry from a GitHub repository (not a house entry or a source bundle) has its GitHub About set before it is submitted... |
| `transcripts_present` | `transcripts` | At least one agent session must parse from the uploaded transcripts: a bundle made by the kit's CLI (node cli/makefun.mj... |
| `transcripts_recorded` | `transcripts` | Every session should be a log a harness recorded, or a file exported from its record. A session handed over by an agent ... |
| `thinking_wellformed` | `transcripts` | Every user, assistant and tool line of a session must carry a timestamp (a session handed over by an agent whose tool ke... |
| `thinking_in_window` | `transcripts` | Every transcript timestamp (each session's first and last, its lines' and its usage records') must fall between the comp... |
| `thinking_committed` | `transcripts` | The uploaded transcripts' sha256 must equal the one the signed entry message names and, once the entries root is committ... |
| `thinking_reproduces` | `transcripts` | The transcripts must account for the code: authored and pasted lines over the counted lines at least the published min_r... |
| `thinking_on_task` | `transcripts` | The transcripts must mention at least the published min_terms of the harness's required terms (for pumpfun-replay: hello... |
| `thinking_turns` | `transcripts` | At least the published min_assistant_turns (5 by default) assistant turns across the upload must carry text or thinking:... |
| `thinking_priced` | `transcripts` | A self-reported session (a file exported afterwards, such as a self-exported chat log, a chat app's export or an ATIF tr... |
| `thinking_revised` | `transcripts` | Some counted file of the snapshot (the entrypoint, or the code it runs) must take its final content from at least the pu... |
| `thinking_fresh` | `transcripts` | For an entry uploaded as a source bundle, whose history begins at a drand beacon root: each agent session credited with ... |
| `thinking_launch` | `transcripts` | An entry whose bounty names a pump.fun entry link hands in a coin, and the entry's transcripts must show it: the coin's ... |
| `transcripts_witnessed` | `transcripts` | Every session came from a recording the site witnessed live while the agent worked: the competition takes no transcript ... |
| `transcripts_run_record` | `transcripts` | An entry received from 17 November 2026 (00:00 UTC), where transcripts are required, carries a run record, so a reviewer... |
| `thinking_own_work` | `transcripts` | Where transcripts are required, the deliverable is the agent's own work, not downloaded or copied in: the sessions' tool... |
| `run_completes` | `grading` | The entry must build and run to completion in the grader's sandbox within the harness's limits.... |
| `run_deterministic` | `grading` | Two runs of the entry on the same data must produce the same action log.... |
| `hindsight_clean` | `grading` | A sealed-window competition's final entry ranked in the top 10, or above the best house entry, and every entry the stand... |
| `distinct_entrant` | `grading` | One place per entrant: after the final phase's last score the organizers' cluster scan joins entries that share an accou... |
| `model_call` | `grading` | Each entry is an LLM agent: on an agent/v1 competition that does not waive this floor (the last sentences say how one do... |
| `dev_profitable` | `grading` | Where a competition races its final live and its race asks for the dev gate (the ranking phase's race, requires_dev_prof... |
| `practice_floor` | `grading` | Where a competition stages its agent/v1 final and the staged block names a practice floor (harness.trials.staged.practic... |
| `contender` | `grading` | Where a competition stages its serial heat (a program/v1 final's timing heat, harness.timing.staged, or a scrape/v1 fina... |
| `finalist_review` | `grading` | Where a judged final names a finalist review (its judge's review: places, 1 to 20, and minutes, 5 to 60), the make.fun t... |
| `disqualified` | `grading` | The make.fun team may disqualify an entry until its competition's results are posted, with a reason its entrant reads: t... |
| `claim_rate` | `claim_request` | A claim is screened at most 30 times an hour, whoever asks for its clearance, and an account asks for at most 90 screens... |
| `claim_root` | `claim_request` | A claim is shown, screened or paid only while its leaf, with its stored proof, folds to the payout root in force on the ... |
| `claim_sanctions` | `claim` | A prize is not paid to a wallet on the sanctioned-address list the server screens claims against; the claim is held on c... |
| `claim_geo` | `claim` | A prize is not paid to a claimant in a blocked country or region, or one whose country or region is unknown (the trusted... |
| `claim_tax_form` | `claim` | A US person whose prizes from this payer reach the reporting threshold in a calendar year files a W-9 before the prize i... |

## 4. Deliverables Checklist (Sản phẩm bàn giao)
- [ ] **repo_url** (form_field): The public repository to enter, https://github.com/<owner>/<repo>....
- [ ] **commit_sha** (form_field): The full 40-character sha of the commit to enter; it must be on a branch of the repository....
- [ ] **bundle** (file): One transcript bundle (.tar.gz) of the agent sessions that built the entry, made by the kit's CLI (n...
- [ ] **transcripts** (file): Loose transcript files (repeat the field), instead of one bundle: .jsonl / .json transcripts, Markdo...
- [ ] **title** (form_field): The entry's public name, 200 characters at most: shown on the board, the entry page and the results ...
- [ ] **entry_message** (form_field): The entry message (make.fun entry v1) naming this request's repository, commit and transcripts, sign...
- [ ] **entry_signature** (form_field): The entry message's Ed25519 signature by a wallet on the account (an agent adds its keypair's wallet...
- [ ] **LICENSE** (repo_file): A license file with an OSI-approved license (MIT or Apache-2.0, for example) at the submitted commit...
- [ ] **main.ts or main.py** (repo_file): The entrypoint the grader runs, at the repository's root (node22: main.ts, python3.13: main.py)....
- [ ] **.makefun/owner.json** (repo_file): Needed whenever the repository's GitHub owner is not the account's GitHub login, so always for an ac...

## 5. Thinking & Revision Strategy (Spec-Kit SDD)
1. **Pass 1 - Draft Implementation**: Generate solution adhering to output format (`/output/entry.txt` or code).
2. **Pass 2 - Refine & Polish**: Execute `edit_file` to produce clean diff, ensuring `thinking_revised` check passes.
3. **Pass 3 - Pre-flight Verification**: Run 14 checks locally with kit CLI.
4. **Pass 4 - Ed25519 Autonomous Sign & Submit**: Dispatch submission with linked Solana wallet.
