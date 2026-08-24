"use client";

import MDEditor from "@uiw/react-md-editor";
import { Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { createArticle, updateArticle } from "@/app/actions/articles";
import { uploadFile } from "@/app/actions/upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WikiEditorProps {
  initialTitle?: string;
  initialContent?: string;
  isEditing?: boolean;
  articleId?: string;
  userId?: string;
}

interface FormErrors {
  title?: string;
  content?: string;
}

export default function WikiEditor({
  initialTitle = "",
  initialContent = "",
  isEditing = false,
  articleId,
  userId = "user-1",
}: WikiEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!content.trim()) {
      newErrors.content = "Content is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle form submission using Server Actions
  // We import server actions and call them from the client component.
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let imageUrl: string | undefined;

      // If there's at least one file, upload the first one via server action
      if (files.length > 0) {
        const fd = new FormData();
        fd.append("files", files[0]);
        // uploadFile is a server action imported below
        const uploaded = await uploadFile(fd);
        imageUrl = uploaded?.url;
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        imageUrl,
        authorId: userId,
      };

      if (isEditing && articleId) {
        await updateArticle(articleId, payload);
        // Redirect to article page after successful update
        router.push(`/wiki/${articleId}`);
      } else {
        const result = await createArticle(payload);
        // Redirect to article page after successful create
        if (result.id) {
          router.push(`/wiki/${result.id}`);
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      console.error("Error submitting article:", err);
      alert("Failed to submit article");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // In a real app, you would navigate back
    const shouldLeave = window.confirm(
      "Are you sure you want to cancel? Any unsaved changes will be lost.",
    );
    if (shouldLeave) {
      console.log("User cancelled editing");
      // navigation logic would go here
    }
  };

  const pageTitle = isEditing ? "Edit Article" : "Create New Article";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
        {isEditing && articleId && (
          <p className="text-muted-foreground mt-2">
            Editing article ID: {articleId}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Section */}
        <Card>
          <CardHeader>
            <CardTitle>Article Title</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="Enter article title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Section */}
        <Card>
          <CardHeader>
            <CardTitle>Article Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown) *</Label>
              <div
                className={`border rounded-md ${
                  errors.content ? "border-destructive" : ""
                }`}
              >
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val || "")}
                  preview="edit"
                  hideToolbar={false}
                  visibleDragbar={false}
                  textareaProps={{
                    name: "content",
                    placeholder: "Write your article content in Markdown...",
                    style: { fontSize: 14, lineHeight: 1.5 },
                    // make these explicit so SSR and client output match exactly
                    // server-rendered HTML used autoCapitalize="none" — keep that value
                    autoCapitalize: "none",
                    autoComplete: "off",
                    autoCorrect: "off",
                    spellCheck: false,
                  }}
                />
              </div>
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <div className="space-y-2">
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer text-sm font-medium"
                  >
                    Click to upload files
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Upload images, documents, or other files to attach to your
                    article
                  </p>
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </div>

              {/* Display uploaded files */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uploaded Files:</Label>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: the order won't change
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {file.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[100px] cursor-pointer"
              >
                {isSubmitting ? "Saving..." : "Save Article"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
