import * as StateScope from './State'
import * as ProxyScope from './Proxy'
import * as HandlerScope from './Handler'
import * as ChangesScope from './Changes'
import * as EvaluatorScope from './Evaluator'
import * as ProcessorScope from './Processor'
import * as CoreHandlerScope from './CoreHandler'
import * as CoreBulkHandlerScope from './CoreBulkHandler'

export namespace AlpineLite{
    interface DataRegion{
        element: HTMLElement;
        data: ProxyScope.AlpineLite.Proxy;
        state: StateScope.AlpineLite.State;
        processor: ProcessorScope.AlpineLite.Processor;
        observer: MutationObserver;
    }
    
    export class Bootstrap{
        private dataRegions_ = new Array<DataRegion>();
        private externalCallbacks_: StateScope.AlpineLite.ExternalCallbacks;

        constructor(externalCallbacks: StateScope.AlpineLite.ExternalCallbacks){
            this.externalCallbacks_ = (externalCallbacks || {});
            if (!this.externalCallbacks_.componentFinder){
                this.externalCallbacks_.componentFinder = (id: string, state: any): any => {
                    if (!id){
                        for (let i = 0; i < this.dataRegions_.length; ++i){
                            if (this.dataRegions_[i].state === state){
                                return this.dataRegions_[i].data;
                            }
                        }

                        return null;
                    }
                    
                    for (let i = 0; i < this.dataRegions_.length; ++i){
                        if (this.dataRegions_[i].element.id === id || this.dataRegions_[i].element.dataset['id'] === id){
                            return this.dataRegions_[i].data;
                        }
                    }

                    return null;
                };
            }
        }

        public Attach(anchors: Array<string> = ['data-x-data', 'x-data']): void{
            anchors.forEach((anchor: string) => {
                document.querySelectorAll(`[${anchor}]`).forEach((element: Element): void => {
                    let attributeValue = element.getAttribute(anchor);
                    if (attributeValue === undefined){//Probably contained inside another region
                        return;
                    }
                    
                    let state = new StateScope.AlpineLite.State(new ChangesScope.AlpineLite.Changes(), (element as HTMLElement), this.externalCallbacks_);
                    let name = `__ar${this.dataRegions_.length}__`;
                    
                    let proxyData = ProxyScope.AlpineLite.Proxy.Create({
                        target: {},
                        name: name,
                        parent: null,
                        element: null,
                        state: state
                    });

                    let processor = new ProcessorScope.AlpineLite.Processor(state);
                    let observer = new MutationObserver((mutations) => {
                        mutations.forEach((mutation) => {
                            if (mutation.type === 'childList'){
                                mutation.removedNodes.forEach((node: Node) => {
                                    if (node?.nodeType !== 1){
                                        return;
                                    }
    
                                    this.dataRegions_.forEach((region: DataRegion) => {
                                        region.state.GetChanges().RemoveListeners(node as HTMLElement);
                                    });
                                    
                                    let uninitKey = CoreHandlerScope.AlpineLite.CoreHandler.GetUninitKey();
                                    if (uninitKey in node){//Execute uninit callback
                                        (node[uninitKey] as () => void)();
                                        delete node[uninitKey];
                                    }
    
                                    CoreBulkHandlerScope.AlpineLite.CoreBulkHandler.RemoveOutsideEventHandlers(node as HTMLElement);
                                });
    
                                mutation.addedNodes.forEach((node: Node) => {
                                    if (node?.nodeType !== 1){
                                        return;
                                    }
    
                                    processor.All((node as HTMLElement), {
                                        checkTemplate: true,
                                        checkDocument: false
                                    });
                                });
                            }
                            else if (mutation.type === 'attributes'){
                                let attrChangeKey = HandlerScope.AlpineLite.Handler.GetAttributeChangeKey();
                                if (attrChangeKey in mutation.target){
                                    (mutation.target[attrChangeKey] as Array<(attr: string) => void>).forEach((callback) => {
                                        callback(mutation.attributeName);
                                    });
                                }
                            }
                        });
                    });
                    
                    state.PushValueContext(proxyData.GetProxy());
                    this.dataRegions_.push({
                        element: (element as HTMLElement),
                        data: proxyData,
                        state: state,
                        processor: processor,
                        observer: observer
                    });

                    processor.All((element as HTMLElement));
                    observer.observe(element, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        characterData: false,
                    });
                });
            });
        }
    }
}
