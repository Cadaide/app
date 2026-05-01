import { Application } from "@/classes/Application";
import { BrowserPlatformCompatFolderPicker } from "./FolderPicker";

export function BrowserPlatformCompat() {
  if (Application.isNative) return <></>;

  window.api = window.api ?? {};

  return (
    <>
      <BrowserPlatformCompatFolderPicker />
    </>
  );
}
