import { StepRunner, BuildStep } from "./step";
import { BackendBuild } from "./steps/backend.build";
import { BackendClean } from "./steps/backend.clean";
import { BackendInstall } from "./steps/backend.install";
import { BinariesDownload } from "./steps/binaries.download";
import { DesktopBuild } from "./steps/desktop.build";
import { DesktopClean } from "./steps/desktop.clean";
import { FrontendBuild } from "./steps/frontend.build";
import { FrontendClean } from "./steps/frontend.clean";
import { FrontendInstall } from "./steps/frontend.install";
import { LauncherBuild } from "./steps/launcher.build";
import { MicroserviceFsBuild } from "./steps/microservice_fs.build";
import { MicroserviceFsClean } from "./steps/microservice_fs.clean";
import { ModulesCopy } from "./steps/modules.copy";
import { OutputPrepare } from "./steps/output.prepare";
import { PackageZip } from "./steps/package.zip";
import { ReleaseCopy } from "./steps/release.copy";

const steps: (new () => BuildStep)[] = [
  // prepare
  OutputPrepare,

  // clean
  FrontendClean,
  BackendClean,
  MicroserviceFsClean,
  DesktopClean,

  // install
  FrontendInstall,
  BackendInstall,

  // build modules
  FrontendBuild,
  BackendBuild,
  MicroserviceFsBuild,
  DesktopBuild,

  // copy modules
  ModulesCopy,

  // download binaries
  BinariesDownload,

  // convert pkg to zip
  PackageZip,

  // build launcher
  LauncherBuild,

  // copy release
  ReleaseCopy,
];

await new StepRunner(steps).runAll();
