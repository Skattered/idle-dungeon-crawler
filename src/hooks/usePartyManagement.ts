import { useCallback, useEffect } from 'react';
import { calculateMemberStats } from '../data/PartyManager';

interface PartyMember {
  id: string;
  name: string;
  role: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  attackTimer: number;
  attackSpeed?: number;
  skillActive?: boolean;
  skill?: any;
  skillDuration?: number;
  isProtected?: boolean;
  gear?: any;
}

interface Upgrades {
  attackBonus: number;
  defenseBonus: number;
  healthBonus: number;
  goldMultiplier: number;
  gearDropBonus: number;
}

interface PartyManagementHookProps {
  party: PartyMember[];
  upgrades: Upgrades;
  setParty: (updater: (prev: PartyMember[]) => PartyMember[]) => void;
}

export const usePartyManagement = ({
  party,
  upgrades,
  setParty
}: PartyManagementHookProps) => {

  // Update party stats when upgrades change
  const updatePartyWithUpgrades = useCallback(() => {
    setParty(prevParty => prevParty.map(member => {
      const stats = calculateMemberStats(member, upgrades);
      const hpPercentage = member.maxHp > 0 ? member.hp / member.maxHp : 1;
      return {
        ...member,
        maxHp: stats.maxHp,
        hp: Math.round(stats.maxHp * hpPercentage), // Maintain HP percentage
        attack: stats.attack,
        defense: stats.defense
      };
    }));
  }, [upgrades, setParty]);

  // Apply upgrade bonuses to party when upgrades change
  useEffect(() => {
    updatePartyWithUpgrades();
  }, [updatePartyWithUpgrades]);

  // Utility functions for party management
  const getAliveMembers = useCallback(() => {
    return party.filter(member => member.hp > 0);
  }, [party]);

  const getNonHealerMembers = useCallback(() => {
    return party.filter(member => (member.role || '') !== 'healer');
  }, [party]);

  const getProtectedHealer = useCallback(() => {
    return party.find(member => (member.role || '') === 'healer' && member.isProtected);
  }, [party]);

  const resetPartyToFullHealth = useCallback(() => {
    setParty(prev => prev.map(member => ({
      ...member,
      hp: member.maxHp,
      attackTimer: 0,
      isProtected: false
    })));
  }, [setParty]);

  const resetAttackTimers = useCallback(() => {
    setParty(prev => prev.map(member => ({
      ...member,
      attackTimer: 0
    })));
  }, [setParty]);

  const revivePartyMembers = useCallback(() => {
    setParty(prev => prev.map(member => ({
      ...member,
      hp: (member.role || '') === 'healer' ? member.hp : member.maxHp, // Don't heal the healer who was already alive
      attackTimer: 0,
      isProtected: false // Remove healer protection after mass res
    })));
  }, [setParty]);

  const updateMemberHp = useCallback((memberId: string, newHp: number) => {
    setParty(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, hp: Math.max(0, newHp) }
        : member
    ));
  }, [setParty]);

  const updateMemberTimer = useCallback((memberId: string, newTimer: number) => {
    setParty(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, attackTimer: newTimer }
        : member
    ));
  }, [setParty]);

  const setMemberProtection = useCallback((memberId: string, isProtected: boolean) => {
    setParty(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, isProtected }
        : member
    ));
  }, [setParty]);

  return {
    updatePartyWithUpgrades,
    getAliveMembers,
    getNonHealerMembers,
    getProtectedHealer,
    resetPartyToFullHealth,
    resetAttackTimers,
    revivePartyMembers,
    updateMemberHp,
    updateMemberTimer,
    setMemberProtection
  };
};