import React,{ useEffect, useState }  from "react";

import { useStyles } from "../../style";
import { BASE_URL } from "../../../../const";

const CodeInfo = () => {
  const { styles } = useStyles();

  const [fileList, setFileList] = useState<string[]>([]);

  useEffect(() => {
    // 假设后端接口为 /api/v1/rag/files，返回 ["file1.pdf", "file2.txt"]
    fetch(BASE_URL + "/rag/files")
      .then(res => res.json())
      .then(data => setFileList(data))
      .catch(() => setFileList([]));
  }, []);

  return (
    <div className={`${styles.codeInfoContainer} ${styles.card}`}>
      <div className={styles.codeInfoBody}>
        <div className={styles.codeInfoIntro}>
          <h4>知识库中包含的文件列表</h4>
          <p>
            
          </p>
        </div>


        {fileList.length > 0 ? (
          fileList.map(file => (
            <div className={styles.codeInfoStepDesc} key={file}>
              {file}
            </div>
          ))
        ) : (
          <div className={styles.codeInfoStepDesc}>暂无文件</div>
        )}

        <br />
        <br />

        {/* <div className={styles.codeInfoSteps}>
          <div className={styles.codeInfoStepItem}>
            <div className={styles.codeInfoStepTitle}>
              <span className={styles.codeInfoTitleText}>1. 知识库检索</span>
            </div>
            <div className={styles.codeInfoStepDesc}>
              系统会从预定义的知识库中检索与用户问题相关的信息。
            </div>
          </div>

          <div className={styles.codeInfoStepItem}>
            <div className={styles.codeInfoStepTitle}>
              <span className={styles.codeInfoTitleText}>2. 信息整合</span>
            </div>
            <div className={styles.codeInfoStepDesc}>
              将检索到的相关信息进行整合和排序，确保回答的准确性和相关性。
            </div>
          </div>

          <div className={styles.codeInfoStepItem}>
            <div className={styles.codeInfoStepTitle}>
              <span className={styles.codeInfoTitleText}>3. 生成回答</span>
            </div>
            <div className={styles.codeInfoStepDesc}>
              基于整合后的信息，生成自然、准确的回答。
            </div>
          </div>
        </div> */}

        <div className={styles.documentationContainer}>
          <h4>使用示例</h4>
          <p>你可以尝试询问以下类型的问题：</p>
          <ul>
            <li>你认识梅光亚吗？他是谁？</li>
            <li>MCP是什么？</li>
            <li>？</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CodeInfo;
