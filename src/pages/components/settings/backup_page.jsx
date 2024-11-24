import { Col } from "react-bootstrap";
import BackupTables from "./backup_tables";
import BackupFiles from "./backupfiles";

export default function BackupPage() {
  return (
    <Col>
      <BackupTables />
      <BackupFiles />
    </Col>
  );
}
