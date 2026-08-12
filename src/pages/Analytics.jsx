import React from 'react';
import { Card, CardBody } from '../components/ui/Card';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Academic Analytics</h1>
      <Card>
        <CardBody className="py-12 text-center text-text-muted text-sm">
          No study session records found. Log your first Pomodoro session to populate charts.
        </CardBody>
      </Card>
    </div>
  );
}
