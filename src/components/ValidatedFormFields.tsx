import React from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent } from "./ui/select";
import { Button } from "./ui/button";

interface ValidationProps {
  hasError?: boolean;
}

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  required = false,
  hasError = false,
  errorMessage,
  className = "",
  ...props
}) => {
  return (
    <div className="space-y-2">
      <Label className={hasError ? "text-red-500" : ""}>
        {label}{required && "*"}
      </Label>
      <Input
        {...props}
        className={`h-14 rounded-2xl ${hasError ? "border-red-500" : ""} ${className}`}
      />
      {hasError && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
};

interface ValidatedSelectProps {
  label: string;
  required?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  label,
  required = false,
  hasError = false,
  errorMessage,
  placeholder = "Please select",
  value,
  onValueChange,
  children,
  className = ""
}) => {
  return (
    <div className="space-y-2">
      <Label className={hasError ? "text-red-500" : ""}>
        {label}{required && "*"}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={`h-14 rounded-2xl ${hasError ? "border-red-500" : ""} ${className}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      {hasError && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
};

interface ValidatedFileUploadProps {
  label: string;
  required?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  buttonText?: string;
  buttonClassName?: string;
}

export const ValidatedFileUpload: React.FC<ValidatedFileUploadProps> = ({
  label,
  required = false,
  hasError = false,
  errorMessage,
  file,
  onFileChange,
  accept = "image/*,.pdf",
  buttonText = "Choose File",
  buttonClassName = "w-full h-14 bg-[#0C4B20] hover:bg-[#8FB200] rounded-2xl"
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  return (
    <div className="space-y-2">
      <Label className={hasError ? "text-red-500" : ""}>
        {label}{required && "*"}
      </Label>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <Button 
        type="button"
        onClick={handleClick}
        className={`${buttonClassName} ${hasError ? "border border-red-500" : ""}`}
      >
        {file ? file.name : buttonText}
      </Button>
      {hasError && errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
};