import { HttpHeaders } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import _ from 'lodash-es';
import { ElectronService } from 'ngx-electron';

import { NotificationService } from '../notification/notification.service';
import { Config, CustomAction, HttpHeader, URLSplit } from './config.model';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config: Config;
  private valid: boolean;
  private errors: string[];
  private update = false;
  private initialized = false;

  private httpHeaders: HttpHeader;

  public constructor(
    private notificationService: NotificationService,
    private _electronService: ElectronService,
    private _zone: NgZone,
  ) {
    this._electronService.ipcRenderer.addListener('configRead', (_, config: Config) => this.initialize(config));
    this._electronService.ipcRenderer.addListener('configSaved', (_, config: Config) => this.initialize(config));
    this._electronService.ipcRenderer.addListener('configError', (_, error: string) => {
      this.notificationService.setError(
        error,
        'Please restart your system. If the issue persists open an issue on GitHub.',
      );
    });

    this._electronService.ipcRenderer.addListener('configPass', () => {
      this._zone.run(() => {
        this.valid = true;
        this.generateHttpHeaders();
        this.initialized = true;
      });
    });
    this._electronService.ipcRenderer.addListener('configFail', (_, errors) => {
      this._zone.run(() => {
        this.valid = false;
        this.errors = errors;
        console.error(errors);
        this.initialized = true;
      });
    });

    this._electronService.ipcRenderer.send('readConfig');
  }

  private initialize(config: Config): void {
    this.config = config;
    this._electronService.ipcRenderer.send('checkConfig', config);
  }

  public generateHttpHeaders(): void {
    this.httpHeaders = {
      headers: new HttpHeaders({
        'x-api-key': this.config.octoprint.accessToken,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0',
      }),
    };
  }

  public getCurrentConfig(): Config {
    return _.cloneDeep(this.config);
  }

  public isEqualToCurrentConfig(changedConfig: Config): boolean {
    return _.isEqual(this.config, changedConfig);
  }

  public validateGiven(config: Config): boolean {
    // TODO
    return true;
  }

  public getErrors(): string[] {
    return this.errors;
  }

  public saveConfig(config: Config): void {
    this._electronService.ipcRenderer.send('saveConfig', config);
  }

  public splitOctoprintURL(octoprintURL: string): URLSplit {
    const host = octoprintURL.split(':')[1].replace('//', '');
    const port = parseInt(octoprintURL.split(':')[2], 10);

    return {
      host,
      port: isNaN(port) ? null : port,
    };
  }

  public mergeOctoprintURL(urlSplit: URLSplit): string {
    if (urlSplit.port !== null || !isNaN(urlSplit.port)) {
      return `http://${urlSplit.host}:${urlSplit.port}/`;
    } else {
      return `http://${urlSplit.host}/`;
    }
  }

  public createConfigFromInput(config: Config): Config {
    const configOut = _.cloneDeep(config);
    configOut.octoprint.url = this.mergeOctoprintURL(config.octoprint.urlSplit);
    delete configOut.octoprint.urlSplit;
    return configOut;
  }

  public isLoaded(): boolean {
    return this.config ? true : false;
  }

  public setUpdate(): void {
    this.update = true;
  }

  public getHTTPHeaders(): HttpHeader {
    return this.httpHeaders;
  }

  public getApiURL(path: string, includeApi = true): string {
    if (includeApi) return `${this.config.octoprint.url}api/${path}`;
    else return `${this.config.octoprint.url}${path}`;
  }

  public getAPIPollingInterval(): number {
    return this.config.octodash.pollingInterval;
  }

  public getPrinterName(): string {
    return this.config.printer.name;
  }

  public getCustomActions(): CustomAction[] {
    return this.config.octodash.customActions;
  }

  public getXYSpeed(): number {
    return this.config.printer.xySpeed;
  }

  public getZSpeed(): number {
    return this.config.printer.zSpeed;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public isValid(): boolean {
    return this.valid;
  }

  public isUpdate(): boolean {
    return this.update;
  }

  public isTouchscreen(): boolean {
    return this.config.octodash.touchscreen;
  }

  public getAmbientTemperatureSensorName(): number {
    return this.config.plugins.enclosure.ambientSensorID;
  }

  public getAutomaticScreenSleep(): boolean {
    return this.config.octodash.turnScreenOffWhileSleeping;
  }

  public getAutomaticPrinterPowerOn(): boolean {
    return this.config.octodash.turnOnPrinterWhenExitingSleep;
  }

  public useTpLinkSmartPlug(): boolean {
    return this.config.plugins.tpLinkSmartPlug.enabled;
  }

  public getSmartPlugIP(): string {
    return this.config.plugins.tpLinkSmartPlug.smartPlugIP;
  }
  public getFilamentThickness(): number {
    return this.config.filament.thickness;
  }

  public getFilamentDensity(): number {
    return this.config.filament.density;
  }

  public getDefaultSortingAttribute(): 'name' | 'date' | 'size' {
    return this.config.octodash.fileSorting.attribute;
  }

  public getDefaultSortingOrder(): 'asc' | 'dsc' {
    return this.config.octodash.fileSorting.order;
  }

  public getDefaultHotendTemperature(): number {
    return this.config.printer.defaultTemperatureFanSpeed.hotend;
  }

  public getDefaultHeatbedTemperature(): number {
    return this.config.printer.defaultTemperatureFanSpeed.heatbed;
  }

  public getDefaultFanSpeed(): number {
    return this.config.printer.defaultTemperatureFanSpeed.fan;
  }

  public isPreheatPluginEnabled(): boolean {
    return this.config.plugins.preheatButton.enabled;
  }

  public isFilamentManagerEnabled(): boolean {
    return this.config.plugins.filamentManager.enabled;
  }

  public getFeedLength(): number {
    return this.config.filament.feedLength;
  }

  public getFeedSpeed(): number {
    return this.config.filament.feedSpeed;
  }

  public getFeedSpeedSlow(): number {
    return this.config.filament.feedSpeedSlow;
  }

  public getPurgeDistance(): number {
    return this.config.filament.purgeDistance;
  }

  public useM600(): boolean {
    return this.config.filament.useM600;
  }

  public showThumbnailByDefault(): boolean {
    return this.config.octodash.preferPreviewWhilePrinting;
  }

  public getAccessKey(): string {
    return this.config.octoprint.accessToken;
  }

  public getDisableExtruderGCode(): string {
    return this.config.printer.disableExtruderGCode;
  }

  public getZBabystepGCode(): string {
    return this.config.printer.zBabystepGCode;
  }

  public getPreviewProgressCircle(): boolean {
    return this.config.octodash.previewProgressCircle;
  }

  public getScreenSleepCommand(): string {
    return this.config.octodash.screenSleepCommand;
  }

  public getScreenWakeupCommand(): string {
    return this.config.octodash.screenWakeupCommand;
  }
}
