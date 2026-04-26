import { ILanguageFileTemplate } from "@/api/language";
import { fillTemplate } from "@/utils/fileTemplates";
import { useEffect, useState } from "react";
import { Input } from "../base/Input";

export interface IFileCreationTemplateFormProps {
  template: ILanguageFileTemplate;
  onFilenameChange: (filename: string) => void;
}

export function FileCreationTemplateForm(
  props: IFileCreationTemplateFormProps,
) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      props.template.formElements?.map((e) => [e.id, ""]) || [],
    ),
  );

  useEffect(() => {
    props.onFilenameChange(fillTemplate(props.template.filename, values));
  }, [values]);

  return (
    <>
      <textarea
        value={fillTemplate(props.template.content, values)}
        readOnly
        hidden
        name="content"
      />

      {props.template.formElements?.map((e) => (
        <Input
          key={e.id}
          label={e.label}
          placeholder={e.placeholder}
          name={"_" + e.id}
          value={values[e.id] || ""}
          onChange={(event) =>
            setValues((prev: any) => ({
              ...prev,
              [e.id]: event.target.value,
            }))
          }
        />
      ))}
    </>
  );
}
