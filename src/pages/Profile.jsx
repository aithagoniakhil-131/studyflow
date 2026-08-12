import React from 'react';
import { Card, CardBody } from '../components/ui/Card';

export default function Profile() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
      <Card>
        <CardBody className="py-12 text-center text-text-muted text-sm">
          Manage your university details, academic targets, and career goals.
        </CardBody>
      </Card>
    </div>
  );
}
