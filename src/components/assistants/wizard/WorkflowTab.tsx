import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
    Node,
    Edge,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    Connection,
    Panel,
    NodeTypes,
    EdgeTypes,
    Handle,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    Plus,
    Play,
    Square,
    Triangle,
    CheckCircle,
    Trash2,
    Settings,
    Info,
    HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

// Custom Node Components
const StartNode = ({ data }: { data: any }) => (
    <div className="relative px-4 py-3 shadow-xl rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 min-w-[200px] group backdrop-blur-md">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <Play className="h-4 w-4 fill-current" />
                </div>
                <div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-300 text-sm tracking-tight leading-none mb-1">{data.title}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-extrabold opacity-60 tracking-wider">START NODE</div>
                </div>
            </div>
            <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteNode', { detail: data.id })); }}
            >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </button>
        </div>
        {data.question && (
            <div className="mt-2 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                <HelpCircle className="h-3 w-3" />
                <span className="truncate">Asks: {data.question}</span>
            </div>
        )}
        <Handle type="source" position={Position.Right} id="right" style={{ background: '#10b981', width: 10, height: 10, border: '2px solid white' }} />
    </div>
);

const TaskNode = ({ data }: { data: any }) => (
    <div className="relative px-4 py-3 shadow-xl rounded-2xl bg-indigo-500/10 border-2 border-indigo-500 min-w-[200px] group backdrop-blur-md">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Square className="h-4 w-4" />
                </div>
                <div>
                    <div className="font-bold text-indigo-700 dark:text-indigo-300 text-sm tracking-tight leading-none mb-1">{data.title}</div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-extrabold opacity-60 tracking-wider">AI TASK</div>
                </div>
            </div>
            <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteNode', { detail: data.id })); }}
            >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </button>
        </div>
        {data.question && (
            <div className="mt-2 text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-lg border border-indigo-500/20 flex items-center gap-1.5">
                <HelpCircle className="h-3 w-3" />
                <span className="truncate">Asks: {data.question}</span>
            </div>
        )}
        <Handle type="target" position={Position.Left} id="left" style={{ background: '#6366f1', width: 10, height: 10, border: '2px solid white' }} />
        <Handle type="source" position={Position.Right} id="right" style={{ background: '#6366f1', width: 10, height: 10, border: '2px solid white' }} />
    </div>
);


const TransferNode = ({ data }: { data: any }) => (
    <div className="relative px-4 py-3 shadow-xl rounded-2xl bg-purple-500/10 border-2 border-purple-500 min-w-[180px] group backdrop-blur-md">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                    <Triangle className="h-4 w-4" />
                </div>
                <div>
                    <div className="font-bold text-purple-700 dark:text-purple-300 text-sm tracking-tight leading-none mb-1">{data.title}</div>
                    <div className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-extrabold opacity-60 tracking-wider">TRANSFER</div>
                </div>
            </div>
            <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteNode', { detail: data.id })); }}
            >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </button>
        </div>
        <Handle type="target" position={Position.Left} id="left" style={{ background: '#a855f7', width: 10, height: 10, border: '2px solid white' }} />
    </div>
);

const EndNode = ({ data }: { data: any }) => (
    <div className="relative px-4 py-3 shadow-xl rounded-2xl bg-rose-500/10 border-2 border-rose-500 min-w-[180px] group backdrop-blur-md">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                    <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                    <div className="font-bold text-rose-700 dark:text-rose-300 text-sm tracking-tight leading-none mb-1">{data.title}</div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-extrabold opacity-60 tracking-wider">END CALL</div>
                </div>
            </div>
            <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteNode', { detail: data.id })); }}
            >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </button>
        </div>
        <Handle type="target" position={Position.Left} id="left" style={{ background: '#f43f5e', width: 10, height: 10, border: '2px solid white' }} />
    </div>
);

const nodeTypes: NodeTypes = {
    start: StartNode,
    task: TaskNode,
    end: EndNode,
    transfer: TransferNode,
};

// Custom Edge
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, data, ...props }: any) => {
    const edgePath = `M ${sourceX} ${sourceY} C ${sourceX + 100} ${sourceY} ${targetX - 100} ${targetY} ${targetX} ${targetY}`;
    const isDefault = !data?.description;

    return (
        <g>
            <path
                d={edgePath}
                fill="none"
                stroke={isDefault ? "#6366f1" : "#f59e0b"}
                strokeWidth="4"
                strokeLinecap="round"
                className="opacity-20 hover:opacity-40 transition-opacity cursor-pointer"
            />
            <path
                d={edgePath}
                fill="none"
                stroke={isDefault ? "#6366f1" : "#f59e0b"}
                strokeWidth="2"
                strokeDasharray={isDefault ? "none" : "5,5"}
                className={!isDefault ? "animate-pulse" : ""}
            />
            <g
                transform={`translate(${(sourceX + targetX) / 2 - 10}, ${(sourceY + targetY) / 2 - 10})`}
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteEdge', { detail: id })); }}
                className="cursor-pointer group"
            >
                <circle r="10" cx="10" cy="10" fill="white" className="shadow-sm border border-zinc-200" />
                <text x="10" y="14" textAnchor="middle" fontSize="12" fill="#ef4444" className="font-bold group-hover:scale-110 transition-transform">×</text>
            </g>
            <text
                x={(sourceX + targetX) / 2}
                y={(sourceY + targetY) / 2 - 20}
                textAnchor="middle"
                fontSize="10"
                className={`font-bold ${isDefault ? 'fill-indigo-600' : 'fill-amber-600 dark:fill-amber-400'}`}
            >
                {isDefault ? "NEXT" : (data.description.length > 30 ? "IF: " + data.description.substring(0, 27) + "..." : "IF: " + data.description)}
            </text>
        </g>
    );
};

const edgeTypes: EdgeTypes = { default: CustomEdge };

interface WorkflowTabProps {
    nodes?: any[];
    edges?: any[];
    onChange: (data: { nodes: any[], edges: any[] }) => void;
}

export const WorkflowTab: React.FC<WorkflowTabProps> = ({ nodes: initialNodes = [], edges: initialEdges = [], onChange }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
    const [connectDialogOpen, setConnectDialogOpen] = useState(false);
    const [conditionalDialogOpen, setConditionalDialogOpen] = useState(false);
    const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
    const [conditionDescription, setConditionDescription] = useState('');
    const [selectedNextType, setSelectedNextType] = useState<string>('task');
    const nodeIdRef = useRef(initialNodes.length + 1);

    // Initial load
    useEffect(() => {
        if (initialNodes.length > 0) {
            // Migration: Convert legacy 'question' nodes to 'task' nodes
            const migratedNodes = initialNodes.map(node => {
                if (node.type === 'question') {
                    return {
                        ...node,
                        type: 'task',
                        data: {
                            ...node.data,
                            type: 'task',
                            input_prompt: node.data.input_prompt || '',
                            first_dialogue: node.data.first_dialogue || '',
                            // Ensure question data is preserved
                            question: node.data.question || '',
                            fieldName: node.data.fieldName || ''
                        }
                    };
                }
                return node;
            });

            setNodes(migratedNodes);
            setEdges(initialEdges);
            nodeIdRef.current = Math.max(...initialNodes.map(n => parseInt(n.id.replace('node_', '') || '0'))) + 1;
        } else if (nodes.length === 0) {
            // Add a default start node
            const startNode = {
                id: 'node_1',
                type: 'start',
                position: { x: 100, y: 150 },
                data: { id: 'node_1', type: 'start', title: 'Getting Started', input_prompt: 'Greet the user and ask how you can help.', first_dialogue: 'Hello! How can I help you today?', question: '', fieldName: '' }
            };
            setNodes([startNode]);
            nodeIdRef.current = 2;
        }
    }, []);

    // Sync up
    useEffect(() => {
        onChange({ nodes, edges });
    }, [nodes, edges]);

    useEffect(() => {
        const handleDeleteEdge = (e: any) => setEdges(eds => eds.filter(edge => edge.id !== e.detail));
        const handleDeleteNode = (e: any) => {
            setNodes(nds => nds.filter(node => node.id !== e.detail));
            setEdges(eds => eds.filter(edge => edge.source !== e.detail && edge.target !== e.detail));
        };
        window.addEventListener('deleteEdge', handleDeleteEdge);
        window.addEventListener('deleteNode', handleDeleteNode);
        return () => {
            window.removeEventListener('deleteEdge', handleDeleteEdge);
            window.removeEventListener('deleteNode', handleDeleteNode);
        };
    }, [setNodes, setEdges]);

    const onConnect = useCallback((params: Connection) => {
        const sourceNode = nodes.find(n => n.id === params.source);
        if (sourceNode?.type === 'end' || sourceNode?.type === 'transfer') return;

        setPendingConnection(params);
        setConditionDescription('');
        setConditionalDialogOpen(true);
    }, [nodes]);

    const handleConditionalSubmit = () => {
        if (!pendingConnection) return;

        setEdges(eds => addEdge({
            ...pendingConnection,
            type: 'default',
            animated: true,
            data: { description: conditionDescription }
        }, eds));

        setConditionalDialogOpen(false);
        setPendingConnection(null);
        setConditionDescription('');
    };


    const addNode = (type: string, position?: { x: number, y: number }) => {
        const id = `node_${nodeIdRef.current++}`;
        const newNode: Node = {
            id, type, position: position || { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
            data: {
                id,
                type,
                title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                input_prompt: '',
                first_dialogue: '',
                question: '',
                fieldName: ''
            }
        };
        setNodes(nds => [...nds, newNode]);
        return newNode;
    };

    const handleConnectClick = () => {
        setConnectDialogOpen(true);
    };

    const handleConnectSubmit = () => {
        if (!selectedNode) return;

        handleSaveNodeDetails(selectedNode.data);

        const newPos = {
            x: selectedNode.position.x + 300,
            y: selectedNode.position.y
        };
        const newNode = addNode(selectedNextType, newPos);

        setEdges(eds => addEdge({
            source: selectedNode.id,
            target: newNode.id,
            sourceHandle: 'right',
            targetHandle: 'left',
            type: 'default',
            animated: true,
            data: { description: '' }
        }, eds));

        setConnectDialogOpen(false);
        setNodeDialogOpen(false);
    };

    const onNodeClick = (_: any, node: Node) => {
        setSelectedNode(node);
        setNodeDialogOpen(true);
    };

    const handleSaveNodeDetails = (details: any) => {
        setNodes(nds => nds.map(n => n.id === selectedNode?.id ? { ...n, data: { ...n.data, ...details } } : n));
        setNodeDialogOpen(false);
    };

    return (
        <div className="h-[800px] w-full relative group/flow rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-[#f8fafc] dark:bg-zinc-950/20">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                className="bg-transparent"
            >
                <Background color="#94a3b8" gap={24} size={1} />
                <Controls className="!bg-white dark:!bg-zinc-900 !border-border/40 !rounded-xl !shadow-xl" />

                <Panel position="top-left" className="m-4">
                    <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-border/40 shadow-xl rounded-2xl overflow-hidden min-w-[160px]">
                        <CardContent className="p-3 flex flex-col gap-2">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[2px] mb-1 px-2">Components</p>
                            <Button variant="outline" size="sm" onClick={() => addNode('task')} className="justify-start gap-2.5 h-10 px-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-indigo-500/10 hover:border-indigo-500/30">
                                <Square className="h-4 w-4 text-indigo-500" />
                                <span className="text-xs font-bold">Standard Task</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => addNode('transfer')} className="justify-start gap-2.5 h-10 px-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-500/10 hover:border-purple-500/30">
                                <Triangle className="h-4 w-4 text-purple-500" />
                                <span className="text-xs font-bold">Transfer Call</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => addNode('end')} className="justify-start gap-2.5 h-10 px-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 border-rose-500/10 hover:border-rose-500/30">
                                <CheckCircle className="h-4 w-4 text-rose-500" />
                                <span className="text-xs font-bold">End Call</span>
                            </Button>
                        </CardContent>
                    </Card>
                </Panel>

                <Panel position="bottom-right" className="m-4">
                    <div className="bg-indigo-600/10 border border-indigo-600/20 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl flex items-center gap-2 backdrop-blur-sm animate-pulse">
                        <Info className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Drag nodes to connect</span>
                    </div>
                </Panel>
            </ReactFlow>

            {/* Node Details Dialog */}
            <Dialog open={nodeDialogOpen} onOpenChange={setNodeDialogOpen}>
                <DialogContent className="max-w-[95vw] w-full bg-white dark:bg-zinc-900 border-border/40 rounded-[2rem] p-8 max-h-[90vh] flex flex-col">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <Settings className="h-6 w-6 text-indigo-500" />
                            Configure {selectedNode?.type} Node
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-4 space-y-6 py-2 custom-scrollbar">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Node Title</Label>
                            <Input
                                value={selectedNode?.data.title || ''}
                                onChange={e => setSelectedNode(n => n ? ({ ...n, data: { ...n.data, title: e.target.value } }) : null)}
                                className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Instructions (Input Prompt)</Label>
                                <Textarea
                                    rows={4}
                                    value={selectedNode?.data.input_prompt || ''}
                                    onChange={e => setSelectedNode(n => n ? ({ ...n, data: { ...n.data, input_prompt: e.target.value } }) : null)}
                                    placeholder="Specific instructions for the AI in this state..."
                                    className="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 rounded-xl resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Dialogue (Greeting Message)</Label>
                                <Input
                                    value={selectedNode?.data.first_dialogue || ''}
                                    onChange={e => setSelectedNode(n => n ? ({ ...n, data: { ...n.data, first_dialogue: e.target.value } }) : null)}
                                    placeholder="What the agent says upon entering this node..."
                                    className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <HelpCircle className="h-5 w-5 text-indigo-500" />
                                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">Question Settings (Optional)</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-4">If you provide a question, the AI will ask it and wait for a response before moving to the next node.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 uppercase">Question to Ask</Label>
                                    <Input
                                        value={selectedNode?.data.question || ''}
                                        onChange={e => setSelectedNode(n => n ? ({ ...n, data: { ...n.data, question: e.target.value } }) : null)}
                                        placeholder="e.g. What is your email address?"
                                        className="h-12 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 uppercase">Field Name (Store as)</Label>
                                    <Input
                                        value={selectedNode?.data.fieldName || ''}
                                        onChange={e => setSelectedNode(n => n ? ({ ...n, data: { ...n.data, fieldName: e.target.value } }) : null)}
                                        placeholder="e.g. userEmail"
                                        className="h-12 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Transitions Section */}
                        <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Next Steps (Transitions)</Label>
                            </div>
                            <div className="space-y-3 pr-2">
                                {edges.filter(edge => edge.source === selectedNode?.id).length === 0 ? (
                                    <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                        <p className="text-sm text-zinc-400 font-medium">No transitions added yet.</p>
                                    </div>
                                ) : (
                                    edges.filter(edge => edge.source === selectedNode?.id).map(edge => {
                                        const targetNode = nodes.find(n => n.id === edge.target);
                                        return (
                                            <div key={edge.id} className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-sm">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-[10px] font-bold text-zinc-500">TO</div>
                                                        <span className="font-bold text-sm text-zinc-700 dark:text-zinc-300">{targetNode?.data.title || 'Unknown Node'}</span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold text-zinc-400 uppercase">Trigger Condition (Empty for Default)</Label>
                                                        <Input
                                                            value={edge.data?.description || ''}
                                                            onChange={(e) => {
                                                                const desc = e.target.value;
                                                                setEdges(eds => eds.map(ed => ed.id === edge.id ? { ...ed, data: { ...ed.data, description: desc } } : ed));
                                                            }}
                                                            placeholder="e.g. If user says yes..."
                                                            className="h-9 text-xs bg-zinc-50 dark:bg-zinc-900/50"
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEdges(eds => eds.filter(ed => ed.id !== edge.id))}
                                                    className="h-10 w-10 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <Button variant="ghost" onClick={() => setNodeDialogOpen(false)} className="rounded-xl h-12 px-6 font-bold">Cancel</Button>
                        <Button
                            onClick={handleConnectClick}
                            disabled={selectedNode?.type === 'end' || selectedNode?.type === 'transfer'}
                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-amber-600/20"
                        >
                            Connect
                        </Button>
                        <Button onClick={() => handleSaveNodeDetails(selectedNode?.data)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-indigo-600/20">Apply Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Conditional Connection Dialog */}
            <Dialog open={conditionalDialogOpen} onOpenChange={setConditionalDialogOpen}>
                <DialogContent className="max-w-[500px] w-full bg-white dark:bg-zinc-900 border-border/40 rounded-[2rem] p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Connection Trigger</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Trigger Condition</Label>
                            <Input
                                value={conditionDescription}
                                onChange={e => setConditionDescription(e.target.value)}
                                placeholder="e.g. If user says yes / If user asks for price"
                                className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 rounded-xl"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConditionalSubmit();
                                }}
                            />
                            <p className="text-[10px] text-zinc-400 font-medium px-1">
                                Leave empty for a "Default" next step connection.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="ghost" onClick={() => setConditionalDialogOpen(false)} className="rounded-xl h-12 px-6 font-bold">Cancel</Button>
                        <Button onClick={handleConditionalSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-indigo-600/20">Create Connection</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Connect Next Node Dialog */}
            <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
                <DialogContent className="max-w-[500px] w-full bg-white dark:bg-zinc-900 border-border/40 rounded-[2rem] p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Select Next Node</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-8">
                        <button
                            onClick={() => setSelectedNextType('task')}
                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${selectedNextType === 'task' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-zinc-100 dark:border-zinc-800 hover:border-indigo-200'}`}
                        >
                            <Square className="h-8 w-8 text-indigo-500" />
                            <span className="font-bold text-sm">Standard Task</span>
                        </button>
                        <button
                            onClick={() => setSelectedNextType('transfer')}
                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${selectedNextType === 'transfer' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-zinc-100 dark:border-zinc-800 hover:border-purple-200'}`}
                        >
                            <Triangle className="h-8 w-8 text-purple-500" />
                            <span className="font-bold text-sm">Transfer Call</span>
                        </button>
                        <button
                            onClick={() => setSelectedNextType('end')}
                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${selectedNextType === 'end' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-zinc-100 dark:border-zinc-800 hover:border-rose-200'}`}
                        >
                            <CheckCircle className="h-8 w-8 text-rose-500" />
                            <span className="font-bold text-sm">End Call</span>
                        </button>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setConnectDialogOpen(false)} className="rounded-xl h-12 px-6 font-bold">Cancel</Button>
                        <Button onClick={handleConnectSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-indigo-600/20">Save & Next</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
