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
        handler: HandlerScope.AlpineLite.Handler;
        observer: MutationObserver;
    }
    
    export class Bootstrap{
        private dataRegions_ = new Array<DataRegion>();

        public InitializeHandlers(handler: HandlerScope.AlpineLite.Handler): void{
            CoreHandlerScope.AlpineLite.CoreHandler.AddAll(handler);
            CoreBulkHandlerScope.AlpineLite.CoreBulkHandler.AddAll(handler);
        }

        public Attach(anchors: Array<string> = ['data-x-data', 'x-data']): void{
            anchors.forEach((anchor: string) => {
                document.querySelectorAll(`[${anchor}]`).forEach((element: Element): void => {
                    let attributeValue = element.getAttribute(anchor);
                    if (attributeValue === undefined){//Probably contained inside another region
                        return;
                    }
                    
                    let state = new StateScope.AlpineLite.State(new ChangesScope.AlpineLite.Changes(), (element as HTMLElement), (id: string): any => {
                        if (!id){
                            return null;
                        }
                        
                        for (let i = 0; i < this.dataRegions_.length; ++i){
                            if (this.dataRegions_[i].element.id === id || this.dataRegions_[i].element.dataset['id'] === id){
                                return this.dataRegions_[i].data;
                            }
                        }

                        return null;
                    });

                    let data = EvaluatorScope.AlpineLite.Evaluator.Evaluate(attributeValue, state);
                    if (typeof data === 'function'){
                        data = (data as () => void)();
                    }
                    
                    let name = `__ar${this.dataRegions_.length}__`;
                    let proxyData = ProxyScope.AlpineLite.Proxy.Create({
                        target: data,
                        name: name,
                        parent: null,
                        element: null,
                        state: state
                    });

                    if (!proxyData){
                        proxyData = ProxyScope.AlpineLite.Proxy.Create({
                            target: {},
                            name: name,
                            parent: null,
                            element: null,
                            state: state
                        });
                    }
                    
                    let handler = new HandlerScope.AlpineLite.Handler();
                    let processor = new ProcessorScope.AlpineLite.Processor(state, handler);

                    let observer = new MutationObserver((mutations) => {
                        mutations.forEach((mutation) => {
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
                        });
                    });
                    
                    state.PushValueContext(proxyData.GetProxy());
                    this.dataRegions_.push({
                        element: (element as HTMLElement),
                        data: proxyData,
                        state: state,
                        processor: processor,
                        handler: handler,
                        observer: observer
                    });

                    ProxyScope.AlpineLite.Proxy.AddCoreSpecialKeys();
                    CoreBulkHandlerScope.AlpineLite.CoreBulkHandler.AddAll(handler);
                    CoreHandlerScope.AlpineLite.CoreHandler.AddAll(handler);

                    processor.All((element as HTMLElement));
                    observer.observe(element, {
                        childList: true,
                        subtree: true,
                        characterData: false,
                    });
                });
            });
        }
    }
}
