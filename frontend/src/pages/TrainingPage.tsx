import React, { useState } from "react";
import { Terminal, Play, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

interface TrainingRun {
  id: string;
  model: string;
  status: "Running" | "Completed" | "Failed";
  epoch: string;
  loss: string;
  started: string;
}

export const TrainingPage: React.FC = () => {
  const [selectedRunId, setSelectedRunId] = useState<string>("#TR-041");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newModel, setNewModel] = useState("Encoder");
  const [newEpochs, setNewEpochs] = useState("20");
  const [newLr, setNewLr] = useState("5e-4");
  const [isLaunching, setIsLaunching] = useState(false);

  const [runs, setRuns] = useState<TrainingRun[]>([
    {
      id: "#TR-042",
      model: "Encoder",
      status: "Running",
      epoch: "12/20",
      loss: "0.324",
      started: "5m ago",
    },
    {
      id: "#TR-041",
      model: "Reranker",
      status: "Completed",
      epoch: "20/20",
      loss: "0.287",
      started: "2 hrs ago",
    },
    {
      id: "#TR-040",
      model: "Decoder",
      status: "Completed",
      epoch: "15/15",
      loss: "1.042",
      started: "1 day ago",
    },
  ]);

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLaunching(true);
    setTimeout(() => {
      const nextId = `#TR-04${runs.length + 1}`;
      const newJob: TrainingRun = {
        id: nextId,
        model: newModel,
        status: "Running",
        epoch: `1/${newEpochs}`,
        loss: "1.240",
        started: "Just now",
      };
      setRuns([newJob, ...runs]);
      setSelectedRunId(nextId);
      setIsLaunching(false);
      setIsModalOpen(false);
    }, 800);
  };

  // Loss data points for #TR-041 (Epoch 1 to 20)
  const lossPoints = [
    { epoch: 1, train: 1.15, val: 1.22 },
    { epoch: 2, train: 0.95, val: 1.05 },
    { epoch: 4, train: 0.74, val: 0.82 },
    { epoch: 6, train: 0.61, val: 0.69 },
    { epoch: 8, train: 0.52, val: 0.58 },
    { epoch: 10, train: 0.44, val: 0.49 },
    { epoch: 12, train: 0.38, val: 0.43 },
    { epoch: 14, train: 0.34, val: 0.39 },
    { epoch: 16, train: 0.31, val: 0.36 },
    { epoch: 18, train: 0.29, val: 0.34 },
    { epoch: 20, train: 0.287, val: 0.332 },
  ];

  // Convert points to SVG coordinates (width: 580, height: 180)
  const chartW = 580;
  const chartH = 180;
  const paddingX = 35;
  const paddingY = 20;

  const minEpoch = 1;
  const maxEpoch = 20;
  const minLoss = 0.2;
  const maxLoss = 1.3;

  const getX = (epoch: number) =>
    paddingX + ((epoch - minEpoch) / (maxEpoch - minEpoch)) * (chartW - paddingX * 2);

  const getY = (loss: number) =>
    chartH - paddingY - ((loss - minLoss) / (maxLoss - minLoss)) * (chartH - paddingY * 2);

  const trainPath = lossPoints.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${getX(pt.epoch)} ${getY(pt.train)}`,
    ""
  );

  const valPath = lossPoints.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${getX(pt.epoch)} ${getY(pt.val)}`,
    ""
  );

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-[#F7F8FC] text-neutral-900 overflow-y-auto">
      {/* Top Header */}
      <div className="h-14 border-b border-neutral-200 bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm text-neutral-900">Training Runs</span>
          </div>

          <span className="text-neutral-300">/</span>

          <span className="text-xs font-mono font-medium text-neutral-600">
            Loss Convergence & Metrics
          </span>
        </div>

        <Button
          size="sm"
          variant="primary"
          leftIcon={<Play className="w-3.5 h-3.5" />}
          onClick={() => setIsModalOpen(true)}
        >
          New Training Job
        </Button>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Table matching Panel 10 */}
        <Card className="bg-white border-neutral-200 shadow-card overflow-hidden">
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-neutral-900">Active & Recent Training Runs</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                PyTorch AdamW training loops with cosine decay scheduling.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-6 font-semibold">Run ID</th>
                  <th className="py-3 px-6 font-semibold">Model</th>
                  <th className="py-3 px-6 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold">Epoch</th>
                  <th className="py-3 px-6 font-semibold">Loss</th>
                  <th className="py-3 px-6 font-semibold">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedRunId === run.id
                        ? "bg-violet-50/60 font-semibold"
                        : "hover:bg-neutral-50/60"
                    }`}
                  >
                    <td className="py-3.5 px-6 font-bold text-neutral-900">{run.id}</td>
                    <td className="py-3.5 px-6 text-neutral-700 font-sans">{run.model}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                          run.status === "Running"
                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            run.status === "Running"
                              ? "bg-sky-500 animate-pulse"
                              : "bg-emerald-500"
                          }`}
                        />
                        {run.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-neutral-600">{run.epoch}</td>
                    <td className="py-3.5 px-6 font-bold text-emerald-600">{run.loss}</td>
                    <td className="py-3.5 px-6 text-neutral-500 font-sans">{run.started}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Training Loss Curve matching Panel 10 */}
        <Card className="p-6 bg-white border-neutral-200 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-neutral-900 font-mono">
                  Training Loss — {selectedRunId}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Convergence trajectory across 20 training epochs with hard-negative mining.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-primary rounded-full" />
                <span className="text-neutral-700 font-medium">Train Loss</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-sky-500 rounded-full" />
                <span className="text-neutral-700 font-medium">Val Loss</span>
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="w-full flex justify-center py-2">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full max-w-2xl h-48 overflow-visible"
            >
              {/* Horizontal grid lines */}
              {[0.4, 0.7, 1.0].map((val) => (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={getY(val)}
                    x2={chartW - paddingX}
                    y2={getY(val)}
                    stroke="#F1F3F8"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={getY(val) + 3}
                    textAnchor="end"
                    fill="#98A2B3"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {val.toFixed(1)}
                  </text>
                </g>
              ))}

              {/* Epoch labels */}
              {[1, 5, 10, 15, 20].map((ep) => (
                <text
                  key={ep}
                  x={getX(ep)}
                  y={chartH - 4}
                  textAnchor="middle"
                  fill="#98A2B3"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  ep {ep}
                </text>
              ))}

              {/* Validation line (Cyan) */}
              <path
                d={valPath}
                fill="none"
                stroke="#0EA5E9"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Training line (Solid Violet) */}
              <path d={trainPath} fill="none" stroke="#6C5CE7" strokeWidth="2.5" />

              {/* Data points on train curve */}
              {lossPoints.map((pt) => (
                <circle
                  key={pt.epoch}
                  cx={getX(pt.epoch)}
                  cy={getY(pt.train)}
                  r="3.5"
                  fill="#6C5CE7"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
          </div>
        </Card>
      </div>

      {/* New Training Job Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Configure & Launch Neural Training Run"
      >
        <form onSubmit={handleLaunch} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700">Target Model</label>
            <select
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 font-mono focus:outline-none focus:border-primary"
            >
              <option value="Encoder">Model A: Code Encoder (Contrastive InfoNCE)</option>
              <option value="Reranker">Model B: Cross-Encoder Reranker (Margin Loss)</option>
              <option value="Decoder">Model C: Causal Decoder (Grounding Citations)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Epochs"
              type="number"
              value={newEpochs}
              onChange={(e) => setNewEpochs(e.target.value)}
            />
            <Input
              label="Learning Rate"
              value={newLr}
              onChange={(e) => setNewLr(e.target.value)}
            />
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-[11px] text-neutral-600 space-y-1 font-mono">
            <div>Optimizer: AdamW (weight_decay=0.01)</div>
            <div>Scheduler: CosineAnnealingLR with warmup</div>
            <div>Device: PyTorch CUDA / CPU auto-selection</div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isLaunching}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              {isLaunching ? "Initializing Weights..." : "Launch Training Run"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
