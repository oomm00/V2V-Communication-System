import React from 'react';
import { motion } from 'framer-motion';

const SkeletonCard = ({ delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex-1">
        <div className="h-4 bg-gray-700/50 rounded-lg w-24 mb-3 animate-pulse"></div>
        <div className="h-8 bg-gray-600/50 rounded-lg w-16 animate-pulse"></div>
        <div className="h-3 bg-gray-700/50 rounded-lg w-32 mt-2 animate-pulse"></div>
      </div>
      <div className="w-16 h-16 bg-gray-700/50 rounded-xl animate-pulse"></div>
    </div>
  </motion.div>
);

const SkeletonTable = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="bg-gray-900/50 border border-gray-700/50 rounded-2xl backdrop-blur-sm overflow-hidden"
  >
    <div className="p-6 border-b border-gray-700/50">
      <div className="h-6 bg-gray-700/50 rounded-lg w-32 animate-pulse"></div>
    </div>
    <div className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gray-700/50 rounded-lg animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700/50 rounded-lg w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-700/50 rounded-lg w-1/2 animate-pulse"></div>
          </div>
          <div className="w-16 h-4 bg-gray-700/50 rounded-lg animate-pulse"></div>
        </div>
      ))}
    </div>
  </motion.div>
);

const SkeletonMap = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="bg-gray-900/50 border border-gray-700/50 rounded-2xl backdrop-blur-sm overflow-hidden h-[600px]"
  >
    <div className="p-6 border-b border-gray-700/50">
      <div className="h-6 bg-gray-700/50 rounded-lg w-24 animate-pulse"></div>
    </div>
    <div className="relative h-full bg-gradient-to-br from-gray-800/30 to-gray-900/30">
      <div className="absolute inset-4 bg-gray-700/30 rounded-xl animate-pulse"></div>
      {/* Fake map markers */}
      <div className="absolute top-20 left-20 w-4 h-4 bg-red-500/50 rounded-full animate-pulse"></div>
      <div className="absolute top-32 right-32 w-4 h-4 bg-blue-500/50 rounded-full animate-pulse"></div>
      <div className="absolute bottom-32 left-1/3 w-4 h-4 bg-green-500/50 rounded-full animate-pulse"></div>
    </div>
  </motion.div>
);

const LoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Top Navigation Skeleton */}
      <div className="bg-gray-900/50 border-b border-gray-700/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-700/50 rounded-xl animate-pulse"></div>
              <div>
                <div className="h-6 bg-gray-700/50 rounded-lg w-32 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-700/50 rounded-lg w-48 animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-10 bg-gray-700/50 rounded-full w-32 animate-pulse"></div>
              <div className="w-10 h-10 bg-gray-700/50 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Skeleton */}
      <div className="px-6 py-4">
        <div className="flex items-center space-x-2 bg-gray-900/50 rounded-2xl p-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-700/50 rounded-xl w-32 animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Status Cards Skeleton */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} delay={i * 0.1} />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="px-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <SkeletonTable />
          <SkeletonMap />
        </div>
      </div>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-8 right-8 bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 flex items-center space-x-3"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="text-gray-300 text-sm">Loading V2V Dashboard...</span>
      </motion.div>
    </div>
  );
};

export default LoadingSkeleton;