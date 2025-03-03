import { Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React from "react";

function FlowChart() {
  const initialNodes = [
    {
      id: "1",
      position: { x: 0, y: 0 },
      data: {
        label: "ENGL 1010",
        description:
          "Workshop in expository writing: strategies of, and practice in, analytical reading and writing about texts. Fundamentals of grammar and syntax. Frequent assignments in writing summaries, analyses, comparisons of texts, and such other expository forms as narration, description, and argumentation. Emphasis on writing as a process: invention, revision, editing.",
      },
      type: "custom",
    },
    {
      id: "2",
      position: { x: -100, y: 100 },
      data: {
        label: "CASD 1205",
        description:
          "Survey of basic concepts in modern communication, includinghistory, theories, models and issues pertaining to intrapersonal,interpersonal, nonverbal, small group, intercultural, and masscommunication. Includes examination of technology, literacy, andcommunication processes.",
      },
      type: "custom",
    },
    {
      id: "3",
      position: { x: 100, y: 100 },
      data: {
        label: "COMM 1000",
        description:
          "Introduction to the theory and practice of the discipline of communication. How people use messages to generate meanings within and across various contexts. How human communication influences and is influenced by the relationships we form, our institutions, society, organizations, and media.",
      },
      type: "custom",
    },
  ];
  const initialEdges = [
    { type: "straight", id: "e1-2", source: "1", target: "2" },
    { type: "straight", id: "e1-3", source: "1", target: "3" },
  ];
  return (
    <div style={{ height: "75dvh", width: "85%" }}>
      <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default FlowChart;
