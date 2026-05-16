"use client";

import { motion } from "framer-motion";
import { Apple, MonitorSmartphone } from "lucide-react";

const platforms = [
  { name: "iOS", icon: Apple },
  { name: "Android", icon: MonitorSmartphone },
  { name: "Windows", icon: MonitorSmartphone },
  { name: "macOS", icon: Apple },
  { name: "Linux", icon: MonitorSmartphone },
  { name: "Router", icon: MonitorSmartphone },
];

export function FlashDownload() {
  return (
    <section id="download" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-purple-400 uppercase tracking-widest mb-4">
            Платформы
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Везде одинаково быстро
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Установите Hiddify на нужную платформу, затем импортируйте VPN-ключ из личного кабинета.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-4xl mx-auto">
          {platforms.map((platform, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group p-6 border border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-white/10 transition-colors text-center cursor-pointer"
            >
              <platform.icon className="w-8 h-8 mx-auto mb-3 text-slate-400 group-hover:text-purple-400 transition-colors" />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                {platform.name}
              </span>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-slate-500 mt-8">
          Hiddify поддерживает Android, iOS, Windows, macOS и Linux.
        </p>
      </div>
    </section>
  );
}
