import { hash } from "bcryptjs";
import readline from "node:readline";

if (!process.stdin.isTTY) {
  console.error("Execute este comando em um terminal interativo.");
  process.exit(1);
}

function hiddenPrompt(label) {
  return new Promise((resolve, reject) => {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdout.write(label);
    let value = "";

    function finish(error) {
      process.stdin.off("keypress", onKeypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    }

    function onKeypress(character, key) {
      if (key.ctrl && key.name === "c") return finish(new Error("Cancelado."));
      if (key.name === "return" || key.name === "enter") return finish();
      if (key.name === "backspace") {
        if (value) {
          value = value.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }
      if (!key.ctrl && !key.meta && character) {
        value += character;
        process.stdout.write("•");
      }
    }

    process.stdin.on("keypress", onKeypress);
  });
}

try {
  const password = await hiddenPrompt("Senha administrativa: ");
  if (password.length < 12)
    throw new Error("Use uma senha com pelo menos 12 caracteres.");
  const confirmation = await hiddenPrompt("Confirme a senha: ");
  if (password !== confirmation) throw new Error("As senhas não coincidem.");
  console.log(`ADMIN_PASSWORD_HASH=${await hash(password, 12)}`);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Não foi possível gerar o hash.",
  );
  process.exitCode = 1;
}
