# India rivers map

How data is built and corrected is in `README.md` ("Correcting the map"). Work goes to the `dev`
branch; `master` is the live site and is only updated when the owner asks.

## Menial data changes: edit, regenerate, push, stop

A menial data change is a straightforward edit to one file in `data/`: a river's fun fact, origin or
end place, name, what it merges into, a naturality tag, hiding a river, and the like.

For these, do only this:

1. Find the uid if the owner gave a name (`node .claude/skills/add-fact/find-river.mjs "<name>"`).
2. Edit the one file in `data/`.
3. Run the generator for that file, because the site publishes the committed files in `public/` and
   the deploy does not rebuild them. Pipe the output to `tail -3`; do not read more unless it fails.
   - `data/river-facts.json`: `npm run data:facts`
   - a naturality tag or text: `npm run data:naturality`
   - `hidden`: `npm run data:hidden`
   - anything else in `data/river-overrides.json` that only changes panel text (`origin`, `end`,
     `entersAt`, `via`, `formedAt`, `branchesAt`, `rename`): `npm run data:places && npm run data:tiles`
4. Stage the edited file and the regenerated `public/` files by path, commit with a one-sentence
   message, and `git push` on the current branch.
5. Reply in one or two lines: what changed and the commit hash.

Do not do any of the following for a menial change:

- no `tsc`, no `verify:*` scripts, no dev server, no panel screenshots, no reading images;
- no checking GitHub Actions, deploy status or the live site after the push;
- no web searches or re-checking the owner's facts or geography;
- no edits to other files "while here" (review notes, README, skills), and no long report.

This overrides the checking steps of any skill, including `/add-fact`. If a generator fails, or the
change turns out to need more than one data file, code changes or a topology rebuild (`down`,
`continues`, `formedBy`, `branchedFrom`, `swapped`, added rivers, course corrections), it is not
menial: say so in one line and follow the README.
