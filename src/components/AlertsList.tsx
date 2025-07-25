import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Alert = {
  id: string;
  title: string;
  body: string;
  createdAt?: { seconds: number; nanoseconds: number } | Date;
};

export default function AlertsList() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const q = query(collection(db, "alerts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert)));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>
      {alerts.length === 0 && <div>No alerts yet.</div>}
      {alerts.map(alert => (
        <div key={alert.id} style={{ marginBottom: "1rem" }}>
          <strong>{alert.title}</strong>
          <div>{alert.body}</div>
          <small>
            {alert.createdAt && typeof alert.createdAt === "object" && "seconds" in alert.createdAt
              ? new Date(alert.createdAt.seconds * 1000).toLocaleString()
              : ""}
          </small>
        </div>
      ))}
    </div>
  );
}