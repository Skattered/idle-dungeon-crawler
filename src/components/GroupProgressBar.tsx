import React from 'react';

interface GroupProgressBarProps {
  currentGroup: number;
  totalGroups: number;
  currentFloor: number;
}

export const GroupProgressBar: React.FC<GroupProgressBarProps> = ({
  currentGroup,
  totalGroups,
  currentFloor
}) => {
  const progressPercentage = ((currentGroup - 1) / (totalGroups - 1)) * 100;
  

  return (
    <div className="bg-gray-800 rounded-lg p-3 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-300">
          Floor {currentFloor} Progress
        </span>
        <span className="text-sm text-blue-400">
          Group {currentGroup}/{totalGroups}
        </span>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="relative mt-2 h-6 px-3">
        {Array.from({ length: totalGroups }, (_, index) => {
          const groupNumber = index + 1;
          const isCompleted = groupNumber < currentGroup;
          const isCurrent = groupNumber === currentGroup;
          // Calculate position to align edges with progress bar
          let leftPosition;
          if (groupNumber === 1) {
            leftPosition = '0px'; // Left edge of 1 aligns with start of bar
          } else if (groupNumber === totalGroups) {
            leftPosition = 'calc(100% - 24px)'; // Right edge of 5 aligns with end of bar
          } else {
            const positionPercentage = ((groupNumber - 1) / (totalGroups - 1)) * 100;
            leftPosition = `calc(${positionPercentage}% - 12px)`; // Center aligned for middle indicators
          }
          
          return (
            <div
              key={groupNumber}
              className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isCurrent
                  ? 'bg-blue-500 text-white animate-pulse'
                  : 'bg-gray-600 text-gray-400'
              }`}
              style={{ 
                left: leftPosition,
                top: 0
              }}
            >
              {isCompleted ? '✓' : groupNumber}
            </div>
          );
        })}
      </div>
    </div>
  );
};