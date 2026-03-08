'use client';

import { useState } from 'react';
import type { Package } from '@shared/types';
import { PackageTable } from './PackageTable';
import { PackageForm } from './PackageForm';

export function PackageManagement() {
  const [selectedPackage, setSelectedPackage] = useState<Package | undefined>();

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Paket Yönetimi</h2>
        <p className="text-sm text-slate-400">
          Paket fiyatlarını ve komisyon oranlarını yönetin.
        </p>
      </div>

      <PackageTable onEdit={setSelectedPackage} />

      <div className="grid gap-6 md:grid-cols-2">
        <PackageForm />
        <div className="space-y-4">
          {selectedPackage ? (
            <PackageForm initialValues={selectedPackage} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
              Güncelleme yapmak için tablodan bir paket seçin.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
