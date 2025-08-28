import React from "react";
import { useParams } from "react-router-dom";
import RagConversationView from "./components/RagConversationView";
import RagLandingView from "./components/RagLandingView";

const RagPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  
  if (conversationId) {
    console.log("RagPage conversationId:", conversationId);
    return <RagConversationView conversationId={conversationId} />;
  } else {
    console.log("没有conversationId", conversationId);
    return <RagLandingView />;
  }
  // 固定使用一个假的 conversationId，始终展示 RagConversationView
  // const conversationId = '1755274978352';
  // return <RagConversationView conversationId={conversationId} />;
  
};

export default RagPage;
