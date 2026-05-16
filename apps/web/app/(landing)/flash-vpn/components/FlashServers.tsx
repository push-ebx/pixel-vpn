"use client";

import { motion } from "framer-motion";
import { MapPin, Wifi } from "lucide-react";

const servers = [
  { location: "Нидерланды", ping: "12ms", load: "15%", status: "online" },
  // { location: "Германия", ping: "18ms", load: "62%", status: "online" },
  // { location: "Франция", ping: "22ms", load: "38%", status: "online" },
  // { location: "Великобритания", ping: "28ms", load: "71%", status: "online" },
  // { location: "США", ping: "85ms", load: "54%", status: "online" },
  // { location: "Сингапур", ping: "92ms", load: "33%", status: "online" },
];

export function FlashServers() {
  return (
    <section id="servers" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-cyan-400 uppercase tracking-widest mb-4">
            Инфраструктура
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Наши серверы
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="border border-white/10 bg-white/5 overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/10 text-sm text-slate-400 font-medium">
              <div>Локация</div>
              <div>Пинг</div>
              <div>Загрузка</div>
              <div>Статус</div>
            </div>
            {servers.map((server, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-4 gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors items-center"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span className="text-white">{server.location}</span>
                </div>
                <div className="text-cyan-400 font-mono">{server.ping}</div>
                <div className="text-slate-400 font-mono">{server.load}</div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">Online</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
