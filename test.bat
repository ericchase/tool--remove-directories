@pushd .
@mkdir test
@cd test
@mkdir remove
@mkdir test
@cd test
@mkdir remove
@mkdir test
@cd test
@mkdir remove
@mkdir test
@cd test
@mkdir remove
@mkdir test
@cd test
@mkdir remove
@mkdir test
@cd test
@mkdir remove
@mkdir test
@popd

deno run --allow-run --allow-read --allow-write main.ts remove
deno run --allow-run --allow-read --allow-write main.ts test
pause