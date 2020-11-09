import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, Component, Injectable, OnInit, OnDestroy, Inject, ViewChild } from '@angular/core';
import * as GoldenLayout from 'golden-layout';
import {
  GoldenLayoutModule,
  MultiWindowService,
  GlOnClose,
  FailedComponent,
  ComponentType,
  GoldenLayoutComponent,
  PluginRegistryService,
  RootWindowService,
  PluginDependencyType,
  GlOnPopout,
  GlOnShow,
  GlOnTab,
  GlOnHide,
  GlOnPopin,
  GlOnResize,
  GlOnUnload,
  IExtendedGoldenLayoutConfig,
  IExtendedGoldenLayoutContainer,
  GoldenLayoutContainer,
} from 'ngx-golden-layout';
import { BehaviorSubject } from 'rxjs';
import { GlHeaderItem } from 'projects/ngx-golden-layout/src/lib/hooks';
import { NestedComponent } from './nested/nested.component';
import { SubcomponentComponent } from './nested/subcomponent/subcomponent.component';
import { OthercomponentComponent } from './nested/othercomponent/othercomponent.component';

const CONFIG2: GoldenLayout.Config = {
  content: [{
    type: "component",
    componentName: "app-test",
    title: "First",
  }],
};

const CONFIG: IExtendedGoldenLayoutConfig = {
  content: [{
    type: "column",
    content: [
      {
        type: 'component',
        componentName: 'app-test',
        title: 'Test 1',
        id: 'foobar',
      },
      {
        type: 'component',
        componentName: 'app-test',
        title: 'Test 2',
        id: 'foobar2',
      },
      {
        type: 'component',
        componentName: 'app-tested',
        title: 'Test 3',
        id: 'foobar3',
      },
      {
        type: 'component',
        componentName: 'nested',
        title: 'Nested Golden-Layout',
        id: 'foobar4',
      },
    ]
  }],
  settings: {
    maximiseAllItems: false,
  }
};

@Injectable()
@MultiWindowService<FooService>('FooService')
export class FooService {
  constructor() {
    console.log(`Create FooService`);
  }
}

@Injectable()
@MultiWindowService<TestService>('TestService')
export class TestService {
  public id: string;
  constructor(private _foo: FooService) {
    console.log(`FooService: `, _foo);
    this.id = '_' + Math.random().toString(36).substr(2, 9);
    console.log(`Creating testService, id: ${this.id}`);
  }
}

@Component({
  template: `<div></div>`,
  styles: [`:host { display: contents; } div { background-color: yellow; width: 100%; height: 100%; }`],
  selector: `app-header-test`,
})
export class HeaderTestComponent {

}

@Component({
  template: `<div class="spawn-new"></div><golden-layout-root #comp [layout]="layout$" (stateChanged)="stateChange()" (tabActivated)="tabActivated($event)"></golden-layout-root>`,
  selector: `app-root`,
})
export class RootComponent {
  public layout$ = new BehaviorSubject(CONFIG);
  @ViewChild(GoldenLayoutComponent, { static: true }) layout: GoldenLayoutComponent;
  constructor(
    private pluginRegistry: PluginRegistryService,
    private root: RootWindowService,
  ) {
  }

    ngAfterViewInit() {
    if (this.root.isChildWindow()) {
      return;
    }

    this.pluginRegistry.waitForPlugin('panel-library').then(() => {
      this.layout.createNewComponent({
        componentName: 'plugin-lib',
        type: 'component',
        title: 'Plugin - Dynamically loaded',
      });
    });
    setTimeout(() => {
      this.pluginRegistry.startLoadPlugin('panel-library', 'http://localhost:8000/panel-library.umd.min.js');
    }, 3000);
    setTimeout(() => {
      this.layout.createNewComponent({
          type: "component",
          componentName: "app-test",
          title: "First",
      }, 'foobar3').then(x => (x.instance as TestComponent).glOnShow());
    }, 5000);
    setTimeout(() => {
      this.layout.createNewComponent({
          type: "component",
          componentName: "app-test",
          title: "Second",
      }, 'foobar')
    }, 10000);
    this.layout.addEvent('tabActivated', () => {
      console.log(arguments);
    }, {});
  }
  stateChange() {
    console.log('State changed');
    //console.log('this.stateChange', this.layout.getSerializableState());
  }
  tabActivated(tab: IExtendedGoldenLayoutContainer) {
    console.log('User activated tab:', tab);
  }
}
@Component({
  template: `<h1>Test</h1><span>{{test.id}}</span>`,
  selector: `app-test`,
})
export class TestComponent implements GlOnPopout, GlOnClose, GlOnHide, GlOnShow, GlOnPopin, GlOnResize, GlOnTab, GlOnUnload {
  private _cleanup: () => void;

  glOnHide(): void {
    console.log('glOnHide');
  }
  constructor(public test: TestService, @Inject(GoldenLayoutContainer) private container: GoldenLayout.Container) {
    const maximisedCallback = () => {
      console.log(container, 'got maximised')
    };
    const minimisedCallback = () => {
      console.log(container, 'got minimised')
    };
    container.parent.parent.on('maximised', maximisedCallback);
    container.parent.parent.on('minimised', minimisedCallback);

    this._cleanup = () => {
      container.parent.parent.off('maximised', maximisedCallback);
      container.parent.parent.off('minimised', minimisedCallback);
    };
  }

  glOnPopout() {
    console.log('glOnPopout');
  }
  async glOnClose() {
    console.log('glOnClose')
  }
  glOnShow() {
    console.log('glOnShow');
  }
  glOnResize() {
    console.log('glOnResize');
  }
  glOnTab() {
    console.log('glOnTab');
  }
  glOnPopin() {
    console.log('glOnPopin');
  }
  glOnUnload() {
    console.log('glOnUnload');
  }
  ngOnInit() {
    console.log('Initialized');
  }
  ngOnDestroy() {
    console.log('Destroyed');
    this._cleanup();
  }
}

@Component({
  template: `<h1>Test2</h1>`,
  selector: `app-tested`,
})
export class TestedComponent implements OnInit, OnDestroy, GlOnClose, GlHeaderItem {
  constructor() { }

  public ngOnInit(): void {
    (window.opener || window).console.log(`ngoninit`);
  }
  public ngOnDestroy(): void {
    (window.opener || window).console.log(`ngondestroy`);
  }

  public headerComponent = HeaderTestComponent;

  public glOnClose(): Promise<void> {
    console.log(`glOnClose`);
    return new Promise((resolve, reject) => {
      console.log(`glonclose promise`);
      setTimeout(() => {
        console.log(`resolving`);
        resolve()
      }, 1000);
    });
  }
}

/* Provide a fallback for components which couldn't be found. */
@Component({
  template: `<h1>Failed to load {{componentName}}</h1>`,
  selector: `app-failed`,
})
export class FailComponent {
  constructor(@Inject(FailedComponent) public componentName: string) { }
}

export const DEPS: PluginDependencyType[] = [
  //{
  //  name: '@angular/core',
  //  loader: import('@angular/core'),
  //}, {
  //  name: '@angular/common',
  //  loader: import('@angular/common'),
  //}, {
  //  name: 'ngx-golden-layout',
  //  loader: import('ngx-golden-layout'),
  //}
];

export const COMPONENTS: ComponentType[] = [
  {
    name: 'app-test',
    type: TestComponent,
  },
  {
    name: 'app-tested',
    type: TestedComponent,
  },
  {
    name: 'nested',
    type: NestedComponent,
  }
];
@NgModule({
  declarations: [
    RootComponent,
    TestComponent,
    TestedComponent,
    FailComponent,
    HeaderTestComponent,
    NestedComponent,
    SubcomponentComponent,
    OthercomponentComponent,
  ],
  entryComponents: [
    HeaderTestComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    GoldenLayoutModule.forRoot(COMPONENTS, FailComponent, DEPS),
  ],
  providers: [
    TestService,
    FooService,
  ],
  bootstrap: [RootComponent]
})
export class AppModule { }
