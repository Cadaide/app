import { Application } from "@/classes/Application";
import { BrowserPlatformCompatFolderPicker } from "./FolderPicker";

export function BrowserPlatformCompat() {
  console.log(window.api);

  if (Application.isNative) return <></>;

  window.api = window.api ?? {};

  return (
    <>
      <BrowserPlatformCompatFolderPicker />
    </>
  );
}
