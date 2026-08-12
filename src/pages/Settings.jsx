import React from 'react';
import { Card, CardBody } from '../components/ui/Card';

export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
      <Card>
        <CardBody className="py-12 text-center text-text-muted text-sm">
          Customize sound volume, Pomodoro intervals, and weekly study targets.
        </CardBody>
      </Card>
    </div>
  );
}
