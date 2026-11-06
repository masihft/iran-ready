# Renders docs/demo.gif. Run from the repo root: vhs docs/demo.tape
Output docs/demo.gif

Set Shell "bash"
Set FontSize 16
Set Width 1240
Set Height 500
Set Padding 20
Set Theme "Catppuccin Mocha"
Set TypingSpeed 45ms

Hide
Type "cd tests/fixtures/react-app && export PS1='$ ' npm_config_progress=false npm_config_loglevel=silent && npx --yes github:masihft/iran-ready scan >/dev/null; clear"
Enter
Sleep 8s
Show

Type "npx github:masihft/iran-ready scan"
Sleep 400ms
Enter
Wait+Screen@20s /findings:/
Sleep 3s

Type "echo $?   # 1 = blocked services found, so CI fails"
Enter
Sleep 4s
