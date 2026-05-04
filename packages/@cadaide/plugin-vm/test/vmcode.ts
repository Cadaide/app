import { cadaide } from "@cadaide/plugin";

async function main() {
  const result = await cadaide.notifications.info("Test");

  console.log(result);
}

main();
