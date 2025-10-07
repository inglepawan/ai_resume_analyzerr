import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

const WipeApp = () => {
    const { auth, isLoading, error, clearError, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [files, setFiles] = useState<FSItem[]>([]);

    const loadFiles = async () => {
        const files = (await fs.readDir("./")) as FSItem[];
        setFiles(files);
    };

    useEffect(() => {
        loadFiles();
    }, []);

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate("/login?next=/wipe");
        }
    }, [isLoading]);

    const handleDelete = async () => {
        // Ensure sequential deletion to avoid overloading the FS API
        for (const file of files) {
            try {
                // Skip directories for safety
                if (!file.is_dir) {
                    await fs.delete(file.path);
                }
            } catch (e) {
                console.error('Failed to delete', file.path, e);
            }
        }
        // Danger: kv.flush wipes all keys across users. Replace with per-user prefix delete.
        const userId = auth.user?.uuid;
        if (userId) {
            const keys = (await kv.list(`resume:${userId}:*`)) as string[];
            if (Array.isArray(keys)) {
                for (const key of keys) {
                    try {
                        await kv.delete(key);
                    } catch (e) {
                        console.error('Failed to delete kv key', key, e);
                    }
                }
            }
        }
        loadFiles();
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error {error}</div>;
    }

    return (
        <div>
            Authenticated as: {auth.user?.username}
            <div>Existing files:</div>
            <div className="flex flex-col gap-4">
                {files.map((file) => (
                    <div key={file.id} className="flex flex-row gap-4">
                        <p>{file.name}</p>
                    </div>
                ))}
            </div>
            <div>
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer"
                    onClick={() => handleDelete()}
                >
                    Wipe App Data
                </button>
            </div>
        </div>
    );
};

export default WipeApp;