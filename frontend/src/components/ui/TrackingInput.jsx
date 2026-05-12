import React, { useState, useEffect, useRef, memo } from 'react';
import * as LucideIcons from 'lucide-react';
import ActionMenu from './ActionMenu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from 'date-fns/locale/es';
import { Bell, X, Calendar } from "lucide-react";

registerLocale('es', es);

const Icon = ({ name, className }) => {
  const iconName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  const LucideIcon = LucideIcons[iconName] || LucideIcons.HelpCircle;
  return <LucideIcon className={className} />;
};

const TrackingInput = memo(({ 
  value, 
  onChange, 
  onAddNote, 
  selectedType, 
  onTypeChange, 
  isAlert, 
  onAlertChange 
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const textareaRef = useRef(null);

  const COMMANDS = [
    { key: 'L', cmd: '/llamada', icon: 'phone' },
    { key: 'C', cmd: '/correo', icon: 'mail' },
    { key: 'M', cmd: '/mensaje', icon: 'send' },
    { key: 'N', cmd: '/nota', icon: 'message-square' }
  ];

  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  const handleSend = () => {
    const textToSend = localValue.trim();
    if (typeof onAddNote === 'function' && textToSend) {
      onAddNote(localValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' || e.key === ' ') {
      const words = localValue.split(' ');
      const inputCmd = words[0].toLowerCase();

      if (inputCmd.startsWith('/') && inputCmd.length >= 2) {
        const match = COMMANDS.find(c => c.cmd.startsWith(inputCmd));
        
        if (match && inputCmd !== match.cmd) {
          e.preventDefault();
          const restOfText = localValue.substring(words[0].length);
          const newValue = match.cmd + ' ' + restOfText.trimStart();
          setLocalValue(newValue);
          onTypeChange(match.key);
          return;
        }
        
        if (match && inputCmd === match.cmd) {
          onTypeChange(match.key);
        }
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (val) => {
    setLocalValue(val);

    const firstWord = val.split(' ')[0].toLowerCase();
    const exactMatch = COMMANDS.find(c => c.cmd === firstWord);
    
    if (exactMatch) {
      onTypeChange(exactMatch.key);
    } else if (!val.startsWith('/')) {
      onTypeChange('N');
    }
  };

  const handleTypeClick = (type) => {
    const target = COMMANDS.find(c => c.key === type);
    onTypeChange(type);
    
    let newValue = localValue;
    if (!localValue.trim() || localValue.startsWith('/')) {
      const words = localValue.split(' ');
      const rest = words.slice(1).join(' ');
      newValue = target.cmd + ' ' + rest;
      setLocalValue(newValue);
      onChange(newValue);
    }
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="p-3 bg-white border-t border-gray-100">
      <div className="relative bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all p-1.5">
        
        {isAlert && (
          <div className="absolute -top-3 left-3 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center gap-1 shadow-sm animate-in fade-in zoom-in">
            <Bell className="h-2.5 w-2.5 fill-current" />
            AGENDADO: {isAlert.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            <button onClick={() => onAlertChange(null)} className="ml-1 hover:text-amber-200">
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe /ll, /cor, /me... y presiona Espacio o Tab"
          className="w-full bg-transparent border-none focus:ring-0 text-[11px] text-gray-700 resize-none py-1 px-2 min-h-[40px] max-h-[100px]"
        />
        
        <div className="flex items-center justify-between border-t border-gray-100 pt-1.5 px-1">
          <div className="flex items-center gap-1.5">
            <div className="flex bg-gray-200/50 p-0.5 rounded-lg border border-gray-200">
              {COMMANDS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleTypeClick(t.key)}
                  className={`flex items-center px-2 py-1 rounded-md text-[9px] font-black transition-all ${
                    selectedType === t.key 
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon name={t.icon} className="h-2.5 w-2.5 mr-1" />
                  {selectedType === t.key && t.cmd.replace('/', '').toUpperCase()}
                </button>
              ))}
            </div>

            <ActionMenu 
                title="Programar Agenda"
                align="start"
                open={isMenuOpen} 
                onOpenChange={setIsMenuOpen} 
                closeOnSelect={false} 
                contentClassName="min-w-[440px]"
                customTrigger={
                    <button 
                        type="button"
                        className={`p-1.5 rounded-lg border transition-all ${
                            isAlert ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-white text-gray-300 border-gray-200 hover:border-amber-300'
                        }`}
                        onClick={() => {
                            if(!isAlert) onAlertChange(new Date()); 
                            setIsMenuOpen(true);
                        }}
                    >
                        <Icon name="bell" className={`h-3.5 w-3.5 ${isAlert ? 'fill-current' : ''}`} />
                    </button>
                }
            >
                <div className="p-3 bg-white">
                    <div className="flex gap-4 items-stretch">
                        
                        <div 
                            className="border-r border-slate-100 pr-4"
                            onClick={(e) => e.stopPropagation()} 
                        >
                            <DatePicker
                                selected={isAlert instanceof Date ? isAlert : new Date()}
                                onChange={(date) => {
                                    const newDate = date || new Date();
                                    if (isAlert instanceof Date) {
                                        newDate.setHours(isAlert.getHours());
                                        newDate.setMinutes(isAlert.getMinutes());
                                    }
                                    onAlertChange(newDate);
                                }}
                                locale="es"
                                inline
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                minDate={new Date()} 
                            />
                        </div>

                        <div 
                        className="flex-1 flex flex-col justify-center py-1 min-w-[140px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            }
                        }}
                        >
                        <div className="space-y-4">
                            <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                                Hora de Alerta
                            </label>
                            <input 
                                type="time"
                                autoFocus
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-sm font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                                value={(isAlert instanceof Date ? isAlert : new Date()).toTimeString().slice(0,5)}
                                onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':');
                                const updatedDate = new Date(isAlert instanceof Date ? isAlert : new Date());
                                updatedDate.setHours(parseInt(hours, 10));
                                updatedDate.setMinutes(parseInt(minutes, 10));
                                onAlertChange(updatedDate);
                                }}
                                onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setIsMenuOpen(false);
                                }
                                }}
                            />
                            </div>

                            <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50">
                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Programado para:
                            </div>
                            <div className="text-[11px] font-black text-slate-700 uppercase">
                                {(isAlert instanceof Date ? isAlert : new Date()).toLocaleDateString('es-PE', { day: '2-digit', month: 'long' })}
                            </div>
                            <div className="text-indigo-600 font-black text-lg leading-tight">
                                {(isAlert instanceof Date ? isAlert : new Date()).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                            </div>
                            
                            <div className="flex flex-col gap-1 items-center opacity-40">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter text-center">
                                Esc para salir • Enter para guardar
                            </span>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </ActionMenu>
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!localValue.trim()}
            className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
              localValue.trim() ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Icon name="arrow-up" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default TrackingInput;