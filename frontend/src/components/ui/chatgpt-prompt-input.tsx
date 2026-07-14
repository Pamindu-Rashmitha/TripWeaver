// TripWeaver PromptBox — adapted from ChatGPT prompt input
"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  SlidersHorizontal,
  ArrowUp,
  X,
  Hotel,
  Plane,
  MapPin,
  ClipboardList,
  Ticket,
  Mic,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppAuth } from "@/hooks/use-auth";
import { ENDPOINTS } from "@/lib/api";

//  Radix Primitives
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    showArrow?: boolean;
  }
>(({ className, sideOffset = 4, showArrow = false, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "relative z-50 max-w-[280px] rounded-md bg-popover text-popover-foreground px-1.5 py-1 text-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    >
      {props.children}
      {showArrow && (
        <TooltipPrimitive.Arrow className="-my-px fill-popover" />
      )}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-64 rounded-xl bg-popover dark:bg-[#303030] p-2 text-popover-foreground dark:text-white shadow-md outline-none animate-in data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;



// TripWeaver Travel Tools 
const toolsList = [
  {
    id: "searchHotels",
    name: "Search Hotels",
    shortName: "Hotels",
    icon: Hotel,
    prefill: "Find hotels in ",
  },
  {
    id: "searchFlights",
    name: "Search Flights",
    shortName: "Flights",
    icon: Plane,
    prefill: "Flights from ",
  },
  {
    id: "exploreDestinations",
    name: "Explore Destinations",
    shortName: "Explore",
    icon: MapPin,
    prefill: "Tell me about ",
  },
  {
    id: "planTrip",
    name: "Plan My Trip",
    shortName: "Plan",
    icon: ClipboardList,
    prefill: "Plan a trip to ",
  },
  {
    id: "bookNow",
    name: "Book Now",
    shortName: "Book",
    icon: Ticket,
    prefill: "Book ",
  },
];

//  PromptBox Props 
export interface PromptBoxProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSendMessage?: (message: string) => void;
}

//  The TripWeaver PromptBox Component 
export const PromptBox = React.forwardRef<HTMLTextAreaElement, PromptBoxProps>(
  ({ className, onSendMessage, ...props }, ref) => {
    const internalTextareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = React.useState("");
    const [selectedTool, setSelectedTool] = React.useState<string | null>(null);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    
    const [isRecording, setIsRecording] = React.useState(false);
    const [isTranscribing, setIsTranscribing] = React.useState(false);
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const { getToken } = useAppAuth();

    React.useImperativeHandle(ref, () => internalTextareaRef.current!, []);

    React.useLayoutEffect(() => {
      const textarea = internalTextareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        const newHeight = Math.min(textarea.scrollHeight, 200);
        textarea.style.height = `${newHeight}px`;
      }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      if (props.onChange) props.onChange(e);
    };

    const handleSend = () => {
      const trimmed = value.trim();
      if (!trimmed) return;
      if (onSendMessage) {
        onSendMessage(trimmed);
      }
      setValue("");
      setSelectedTool(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const toggleRecording = async () => {
      if (isRecording) {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        return;
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          setIsTranscribing(true);
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("file", audioBlob, "recording.webm");
          
          try {
            const token = await getToken();
            const res = await fetch(ENDPOINTS.transcribe, {
              method: "POST",
              headers: {
                ...(token && { Authorization: `Bearer ${token}` })
              },
              body: formData
            });
            if (res.ok) {
              const data = await res.json();
              if (data.text) {
                setValue((prev) => (prev ? prev + " " + data.text : data.text));
              }
            }
          } catch (e) {
            console.error("Transcription failed", e);
          } finally {
            setIsTranscribing(false);
            stream.getTracks().forEach(track => track.stop());
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone", err);
        alert("Microphone access denied or unavailable.");
      }
    };

    const handleToolSelect = (toolId: string) => {
      const tool = toolsList.find((t) => t.id === toolId);
      if (tool) {
        setSelectedTool(toolId);
        setValue(tool.prefill);
        setIsPopoverOpen(false);
        // Focus textarea and place cursor at end
        setTimeout(() => {
          const textarea = internalTextareaRef.current;
          if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(
              tool.prefill.length,
              tool.prefill.length
            );
          }
        }, 50);
      }
    };

    const hasValue = value.trim().length > 0;
    const activeTool = selectedTool
      ? toolsList.find((t) => t.id === selectedTool)
      : null;
    const ActiveToolIcon = activeTool?.icon;

    return (
      <div
        className={cn(
          "flex flex-col rounded-[28px] p-2 shadow-sm transition-colors bg-white border dark:bg-[#303030] dark:border-transparent cursor-text",
          className
        )}
      >


        <textarea
          ref={internalTextareaRef}
          rows={1}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={isTranscribing ? "Transcribing..." : isRecording ? "Listening..." : "Let's plan your next adventure..."}
          className="custom-scrollbar w-full resize-none border-0 bg-transparent p-3 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-300 focus:ring-0 focus-visible:outline-none min-h-12"
          {...props}
        />

        <div className="mt-0.5 p-1 pt-0">
          <TooltipProvider delayDuration={100}>
            <div className="flex items-center gap-2">


              {/* Travel Tools popover */}
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex h-8 items-center gap-2 rounded-full p-2 text-sm text-foreground dark:text-white transition-colors hover:bg-accent dark:hover:bg-[#515151] focus-visible:outline-none focus-visible:ring-ring"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        {!selectedTool && "Travel Tools"}
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" showArrow={true}>
                    <p>Explore Travel Tools</p>
                  </TooltipContent>
                </Tooltip>
                <PopoverContent side="top" align="start">
                  <div className="flex flex-col gap-1">
                    {toolsList.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool.id)}
                        className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent dark:hover:bg-[#515151]"
                      >
                        <tool.icon className="h-4 w-4" />
                        <span>{tool.name}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Active tool indicator */}
              {activeTool && (
                <>
                  <div className="h-4 w-px bg-border dark:bg-gray-600" />
                  <button
                    onClick={() => {
                      setSelectedTool(null);
                      setValue("");
                    }}
                    className="flex h-8 items-center gap-2 rounded-full px-2 text-sm dark:hover:bg-[#3b4045] hover:bg-accent cursor-pointer dark:text-indigo-300 text-indigo-500 transition-colors flex-row justify-center"
                  >
                    {ActiveToolIcon && <ActiveToolIcon className="h-4 w-4" />}
                    {activeTool.shortName}
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Right-aligned buttons */}
              <div className="ml-auto flex items-center gap-2">

                {/* Microphone button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={toggleRecording}
                      disabled={isTranscribing}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none hover:bg-accent dark:hover:bg-[#515151]",
                        isRecording ? "text-red-500 animate-pulse" : "text-muted-foreground",
                        isTranscribing ? "opacity-50" : ""
                      )}
                    >
                      {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
                      <span className="sr-only">{isRecording ? "Stop recording" : "Start recording"}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" showArrow={true}>
                    <p>{isRecording ? "Stop recording" : isTranscribing ? "Transcribing..." : "Voice input"}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Send button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!hasValue}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80 disabled:bg-black/40 dark:disabled:bg-[#515151]"
                    >
                      <ArrowUp className="h-4 w-4" />
                      <span className="sr-only">Send message</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" showArrow={true}>
                    <p>Send</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </div>
    );
  }
);
PromptBox.displayName = "PromptBox";
