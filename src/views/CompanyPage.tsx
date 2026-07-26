import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Globe, Users, Briefcase, Star, ExternalLink, ChevronRight, Sparkles, Heart } from 'lucide-react';
import { companyService, isSupabaseConfigured } from '../lib/supabase';
import type { Company } from '../types';

interface CompanyPageProps {
  companyId: string;
  onBack: () => void;
}

export function CompanyPage({ companyId, onBack }: CompanyPageProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (isSupabaseConfigured()) {
        const { data } = await companyService.get(companyId);
        setCompany(data);
      }
      setLoading(false);
    };
    load();
  }, [companyId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Company not found</h2>
        <button onClick={onBack} className="mt-4 text-sm text-blue-400 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden">
        {company.banner ? (
          <img src={company.banner} alt={company.name} className="w-full h-64 object-cover" />
        ) : (
          <div className="w-full h-64 bg-gradient-to-r from-blue-900/60 via-purple-900/40 to-[#18181B]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-end gap-5">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#09090B] shadow-xl" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-blue-600/30 flex items-center justify-center ring-4 ring-[#09090B]">
                <Building2 className="w-10 h-10 text-blue-400" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">{company.name}</h1>
                {company.verification_badge && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">Verified</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                {company.industry && <span>{company.industry}</span>}
                {company.headquarters && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {company.headquarters}</span>}
                {company.size && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {company.size}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <section className="p-6 bg-[#18181B] border border-[#27272A] rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" /> About
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              {company.description || 'No description available.'}
            </p>
            {company.business_value && (
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <p className="text-xs text-blue-300 font-medium">Mission & Values</p>
                <p className="text-sm text-gray-300 mt-1">{company.business_value}</p>
              </div>
            )}
          </section>

          {/* Benefits */}
          {company.benefits && company.benefits.length > 0 && (
            <section className="p-6 bg-[#18181B] border border-[#27272A] rounded-2xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-purple-400" /> Benefits & Perks
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {company.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-[#09090B] border border-[#27272A] rounded-xl text-sm text-gray-300">
                    <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    {benefit}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gallery */}
          {company.gallery && company.gallery.length > 0 && (
            <section className="p-6 bg-[#18181B] border border-[#27272A] rounded-2xl space-y-4">
              <h2 className="text-base font-bold text-white">Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {company.gallery.map((item, idx) => (
                  <div key={idx} className="aspect-video rounded-xl overflow-hidden bg-zinc-800">
                    <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="p-6 bg-[#18181B] border border-[#27272A] rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Company Info</h3>
            <div className="space-y-3 text-xs">
              {company.headquarters && (
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{company.headquarters}</span>
                </div>
              )}
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{company.website}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {company.size && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>{company.size} employees</span>
                </div>
              )}
              {company.hiring_status && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{company.hiring_status}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          {company.social_links && Object.keys(company.social_links).length > 0 && (
            <div className="p-6 bg-[#18181B] border border-[#27272A] rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Social Links</h3>
              <div className="space-y-2">
                {Object.entries(company.social_links).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-gray-400 hover:text-blue-400 hover:border-blue-500/40 transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="capitalize">{platform}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={onBack}
            className="w-full py-3 bg-[#18181B] border border-[#27272A] rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:border-gray-500 transition-all"
          >
            Back to Search
          </button>
        </div>
      </div>
    </div>
  );
}
