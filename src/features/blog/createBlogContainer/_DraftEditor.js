import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { thunk_createBlog, thunk_uploadBlogImage } from "../../../stores/blogsSlice";
import { toast } from "react-toastify";

import InputText from "../../../components/inputText/InputText";
import Button from "../../../components/button/Button";
import Modal from "../../../components/modal/Modal";
import Confirm from "../../../components/confirm/Confirm";

import { Editor } from "react-draft-wysiwyg";
import {
  EditorState,
  convertToRaw,
  Modifier,
  SelectionState,
  ContentState,
  convertFromHTML,
  convertFromRaw,
  DefaultDraftBlockRenderMap
} from "draft-js";
import { stateFromHTML } from "draft-js-import-html";
import draftToHtml from "draftjs-to-html";

import * as customValidator from "../../../validation/validation";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Map } from "immutable";

function DraftEditor(props) {
  const { initialTitle, initialContent } = props;

  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
  const [title, setTitle] = useState("");

  const initialError = { title: "", editor: "" };
  const [errorInput, setErrorInput] = useState({ ...initialError });

  const [modalPreviewIsOpen, setModalPreviewIsOpen] = useState(false);
  const [modalConfirmCancel, setModalConfirmCancel] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const titleInputEl = useRef(null);

  const onChangeTitle = (ev) => setTitle((prev) => ev.target.value);

  const openModalPreview = () => setModalPreviewIsOpen(true);
  const closeModalPreview = () => setModalPreviewIsOpen(false);

  const openModalConfirmCancel = () => setModalConfirmCancel(true);
  const closeModalConfirmCancel = () => setModalConfirmCancel(false);

  useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle);
      titleInputEl.current.value = initialTitle;
    }

    if (initialContent) {
      const customBlockRenderMap = DefaultDraftBlockRenderMap.merge(
        new Map({
          test: {
            element: "img",
            wrapper: <figure className="test" />
          }
        })
      );
      // const initialContent =
      //   '<div><figure><img src="https://res.cloudinary.com/duzw1g3u8/image/upload/v1686562246/Campboy/posts/16865622430415114484701.jpg"/></figure></div>';

      function createBlock(element, children) {
        // ตรวจสอบและปรับแต่ง Block Element ตามต้องการ
        if (element.tagName === "CUSTOMBLOCK") {
          return {
            type: "custom-block",
            data: {},
            text: children[0].text,
            children: []
          };
        }
        // สร้าง Block Element ตามวิธีการปกติ
        return {
          type: element.tagName.toLowerCase(),
          data: {},
          text: "",
          children: children
        };
      }

      function createInlineStyle(element, children) {
        // ตรวจสอบและปรับแต่ง Inline Style ตามต้องการ
        if (element.tagName === "CUSTOMSTYLE") {
          return {
            type: "CUSTOM_STYLE",
            data: {},
            text: children[0].text,
            children: []
          };
        }
        // สร้าง Inline Style ตามวิธีการปกติ
        return {
          type: element.tagName.toLowerCase(),
          data: {},
          text: "",
          children: children
        };
      }

      const contentBlocks = convertFromHTML(initialContent);
      // const contentBlocks = convertFromHTML(initialContent);
      console.log(initialContent);
      console.log(contentBlocks);

      const contentState = ContentState.createFromBlockArray(contentBlocks.contentBlocks, contentBlocks.entityMap);
      const rawContentState = convertToRaw(contentState);

      const newEditorState = EditorState.createWithContent(convertFromRaw(rawContentState));
      setEditorState(() => newEditorState);
    }
  }, [initialTitle, initialContent]);

  const handleOnChangeEditor = (newContent) => setEditorState(newContent);

  const uploadCallback = async (file) => {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        setTimeout(() => {
          reader.onload = () => {
            resolve({ data: { link: reader.result } });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }, 500);
      });
    } catch (error) {
      console.log(error);
    }
  };

  // upload image(base64) to cloudinary and get public_id then change entity of image {src : base64} to {src : url}
  const uploadImageReplaceURL = async () => {
    const contentState = editorState.getCurrentContent();
    const rawContentState = convertToRaw(contentState);
    const entityMap = rawContentState.entityMap;
    let featureImage = null;

    for (let key in entityMap) {
      if (entityMap[key].type === "IMAGE") {
        if (entityMap[key].data.src.startsWith("data:image")) {
          const base64Data = entityMap[key].data.src;
          const blob = await fetch(base64Data).then((res) => res.blob());
          const file = new File([blob], "imageBlog", { type: blob.type });

          const formData = new FormData();
          formData.append("imageBlog", file);

          const public_id = await dispatch(thunk_uploadBlogImage(formData));
          entityMap[key].data.src = public_id;
        }

        if (!featureImage) featureImage = entityMap[key].data.src;
      }
    }
    return featureImage;
  };

  const handlePublishButton = async () => {
    try {
      //+ Validation
      const error = initialError;
      setErrorInput((prev) => ({ ...initialError }));

      //- Check Title
      if (!customValidator.isNotEmpty(title)) error.title = "Title is required";

      //- Check Editor
      const plainText = editorState.getCurrentContent().getPlainText();
      if (!customValidator.isNotEmpty(plainText)) error.editor = "Content in Editor is required";

      setErrorInput((prev) => ({ ...error }));

      const isError = error.editor || error.title;

      if (!isError) {
        const featureImage = await uploadImageReplaceURL();
        const rawContentState = convertToRaw(editorState.getCurrentContent());
        const html = draftToHtml(rawContentState);
        const inputData = { title, html, featureImage };
        await dispatch(thunk_createBlog(inputData));
        navigate("/blog");
        toast.success("Blog post have succesful created");
      }
    } catch (error) {
      toast.error(error.response.data.message);
      console.log(error.response.data.message);
    }
  };

  const handlePreviewButton = () => openModalPreview();
  const handleCancelButton = () => openModalConfirmCancel();
  const handleConfirmCancel = () => navigate("/blog");

  // receive element and is wrapped in Custom Component
  function customBlockRenderFunc(contentBlock) {
    const type = contentBlock.getType();

    if (type === "atomic") {
      const entityKey = contentBlock.getEntityAt(0);
      const contentState = editorState.getCurrentContent();
      const entity = contentState.getEntity(entityKey);

      if (entity.getType() === "IMAGE") {
        contentState.mergeEntityData(entityKey, { alignment: "center" });

        function ImageComponent(props) {
          const { blockProps } = props;
          const { entity } = blockProps;

          return (
            <picture style={{ textAlign: entity.alignment }}>
              <img src={entity.src} alt="imageBlog" style={{ width: entity.width, height: entity.height }} />
            </picture>
          );
        }

        return {
          component: ImageComponent,
          editable: false,
          props: {
            entity: contentState.getEntity(entityKey).getData()
          }
        };
      }
    }
  }

  // handle in case of copy other content and paste to the Editor (set atomic block that empty entity to unstyled block)
  const handlePastedText = (text, html) => {
    const contentState = stateFromHTML(html);
    const editorStateWithContent = EditorState.createWithContent(contentState);

    const newEditorState = contentState.getBlockMap().reduce((initiaEditorState, block) => {
      // Check empty of entity in block, all entity of character is null
      const isEmptyEntity = block
        .getCharacterList()
        .reduce((arr, character) => Boolean(!character.getEntity()) || arr, false);

      // If block type is atomic and empty entity
      if (block.getType() === "atomic" && isEmptyEntity) {
        // Create selectionState and set to currentEditorState
        const emptyEntityBlockKey = block.getKey();
        const selectionState = SelectionState.createEmpty(emptyEntityBlockKey);
        const editorStateWithSelectionState = EditorState.forceSelection(initiaEditorState, selectionState);

        const contentStateWithSelectionState = editorStateWithSelectionState.getCurrentContent();
        const newBlock = block.merge({ type: "unstyled" });

        const contentStateWithNewBlockType = Modifier.setBlockType(
          contentStateWithSelectionState,
          selectionState,
          "unstyled"
        );

        const editorStateWithNewBlockType = EditorState.push(
          editorStateWithSelectionState,
          contentStateWithNewBlockType,
          "change-block-type"
        );

        return editorStateWithNewBlockType;
      }
      return initiaEditorState;
    }, editorStateWithContent);

    setEditorState(() => newEditorState);

    return "handled";
  };

  return (
    <div className="draft-editor-group">
      <div className="title-group">
        <h4>Title</h4>
        <InputText ref={titleInputEl} placeholder="Title" onChange={onChangeTitle} errorText={errorInput.title} />
      </div>

      <div className="content-group">
        <h4>Content</h4>
        <Editor
          wrapperStyle={errorInput.editor ? { border: "2px solid red" } : {}}
          wrapperClassName="wrapper"
          editorClassName="editor"
          editorState={editorState}
          onEditorStateChange={handleOnChangeEditor}
          placeholder="Tell your story..."
          // customBlockRenderFunc={customBlockRenderFunc}
          handlePastedText={handlePastedText}
          toolbar={{
            image: {
              uploadCallback: uploadCallback,
              alignmentEnabled: false,
              previewImage: true,
              alt: { present: true, mandatory: false },
              defaultSize: {
                height: "auto",
                width: "100%"
              }
            }
          }}
        />
      </div>

      <div className="button-group">
        <Button name="Preview" onClick={handlePreviewButton} />
        <Button name="Publish" onClick={handlePublishButton} />
        <Button name="Cancel" className="btn-cancel" onClick={handleCancelButton} />
      </div>

      <Button
        name="Test"
        onClick={() => {
          // editorState
          //   .getCurrentContent()
          //   .getBlocksAsArray()
          //   .forEach((block) => {
          //     console.log(block.getType());
          //     console.log(block.getText());
          //   });
          console.log(draftToHtml(convertToRaw(editorState.getCurrentContent())));
        }}
      />

      <Modal header={title ? title : "<Title>"} isOpen={modalPreviewIsOpen} closeModal={closeModalPreview}>
        <div dangerouslySetInnerHTML={{ __html: draftToHtml(convertToRaw(editorState.getCurrentContent())) }}></div>
      </Modal>
      <Modal header="Confirm Cancel" isOpen={modalConfirmCancel} closeModal={closeModalConfirmCancel}>
        <Confirm onCancel={closeModalConfirmCancel} onConfirm={handleConfirmCancel} />
      </Modal>
    </div>
  );
}

export default DraftEditor;
